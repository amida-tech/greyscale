'use strict';

angular.module('greyscaleApp')
    .controller('PmDashboardProductCtrl', function (_, $q, $scope, $state, $stateParams,
        greyscaleProductApi, greyscaleProductTasksTbl, $timeout, greyscaleUtilsSrv, greyscaleTokenSrv, greyscaleTaskApi, Organization, greyscaleModalsSrv,
        greyscaleGlobals, greyscaleProductWorkflowApi, greyscaleSurveyApi, greyscaleProjectApi,  inform) {
    
    var productId = $stateParams.productId;
    
    var tasksTable = greyscaleProductTasksTbl;
    tasksTable.dataFilter.productId = productId;
    tasksTable.expandedRowTemplateUrl = 'views/controllers/pm-dashboard-product-tasks-extended-row.html';
    tasksTable.expandedRowExtData = {
        notifyUser: _notifyUser,
        moveNextStep: _moveNextStep
    };
    
    var _exportUri = '/products/' + productId + '/export.csv?token=' + greyscaleTokenSrv();
    
    $scope.model = {
        tasksTable: tasksTable,
        exportHref: greyscaleUtilsSrv.getApiBase() + _exportUri,
        count: {}
    };
    
    var _dicts = {
        surveys: []
    };
    greyscaleProductApi.get(productId).then(function (product) {
        $scope.model.product = product;
        
        if (product.surveyId) {
            greyscaleSurveyApi.get(product.surveyId).then(function (survey) {
                $scope.model.survey = survey;
            });
        }
        greyscaleProjectApi.surveysList(product.projectId).then(function (surveys) {
            _dicts.surveys = surveys;
        });
        
        $state.ext.productName = product.title;
        return product;
    });
    
    Organization.$lock = true;
    
    tasksTable.onReload = function () {
        var tasksData = tasksTable.dataShare.tasks || [];
        
        $scope.model.count.uoas = _.size(_.groupBy(tasksData, 'uoaId'));
        
        $scope.model.count.flagged = _getFlaggedCount(tasksData);
        
        $scope.model.count.started = _.filter(tasksData, 'started').length;
        
        $scope.model.count.onTime = _.filter(tasksData, function (o) {
            return o.onTime && o.status === 'current';
        }).length;
        $scope.model.count.late = _.filter(tasksData, function (o) {
            return !o.onTime && o.status === 'current';
        }).length;
        $scope.model.count.complete = _.filter(tasksData, function (o) {
            return o.status === 'completed';
        }).length;
        
        $scope.model.count.delayed = $scope.model.count.uoas - $scope.model.count.onTime;
    };
    
    _getData(productId)
            .then(function (data) {
        $scope.model.tasks = data.tasks;
    });
    
    $scope.$on('$destroy', function () {
        Organization.$lock = false;
    });
    
    $scope.download = function (e) {
        if (!$scope.model.downloadHref) {
            e.preventDefault();
            e.stopPropagation();
            greyscaleProductApi.product(productId).getTicket()
                    .then(function (ticket) {
                $scope.model.downloadHref = greyscaleProductApi.getDownloadDataLink(ticket);
                $timeout(function () {
                    e.currentTarget.click();
                });
            });
        }
    };
    
    $scope.editProductTasks = function () {
        $state.go('projects.setup.tasks', {
            productId: $scope.model.product.id,
            product: $scope.model.product
        });
    };
    
    var tns = 'PRODUCTS.TABLE.';
    
    var _cols = [{
            field: 'title',
            title: tns + 'TITLE',
            show: true,
            dataRequired: true
        }, {
            field: 'description',
            title: tns + 'DESCRIPTION',
            show: true,
            dataRequired: true,
            dataFormat: 'textarea'
        }, {
            field: 'surveyId',
            title: tns + 'SURVEY',
            show: true,
            dataFormat: 'option',
            dataSet: {
                getData: _getSurveys,
                keyField: 'id',
                valField: 'title',
                groupBy: function (item) {
                    return item.policyId ? 'Policies' : 'Surveys';
                }
            }
        }, {
            field: 'status',
            show: true,
            title: tns + 'STATUS',
            dataFormat: 'option',
            dataNoEmptyOption: true,
            dataSet: {
                getData: _getStatus,
                keyField: 'id',
                valField: 'name',
                getDisabled: _getDisabledStatus
            }
        }];
    
    var _table = {
        cols: _cols,
        formTitle: tns + 'PRODUCT',
    };
    
    $scope.editProduct = function () {
        var op = 'editing';
        _loadProductExtendedData($scope.model.product).then(function (extendedProduct) {
            var _editTable = angular.copy(_table);
            return greyscaleModalsSrv.editRec(extendedProduct, _editTable);
        }).then(function (newProduct) {
            return greyscaleProductApi.update(newProduct);
        }).then(function (product) {
            $scope.model.product = product;
        }).catch(function (err) {
            return _errHandler(err, op);
        });
    };
    
    $scope.removeProduct = function () {
        greyscaleModalsSrv.confirm({
            message: 'PRODUCTS.TABLE.DELETE_CONFIRM',
            product: $scope.model.product,
            okType: 'danger',
            okText: 'COMMON.DELETE'
        }).then(function () {
            greyscaleProductApi.delete($scope.model.product.id).then(function () {
                $state.go('main');
            }).catch(function (err) {
                inform.add('Product delete error: ' + err);
            });
        });
    };
    
    $scope.editProductWorkflow = function () {
        greyscaleModalsSrv.productWorkflow($scope.model.product).then(function (data) {
            return _saveWorkflowAndSteps($scope.model.product, data);
        }).then(function (product) {
            $scope.model.product = product;
        });
    };
    
    function _saveWorkflowAndSteps(product, data) {
        var promise = $q.when(data.workflow);
        if (!_.isEqual(data.workflow, product.workflow)) {
            promise = _saveProductWorkflow(data.workflow);
        }
        return promise.then(function (workflow) {
            return _saveProductWorkflowSteps(workflow.id, data.steps);
        });
    }
    
    function _saveProductWorkflow(workflow) {
        if (workflow.id) {
            return greyscaleProductWorkflowApi.update(workflow).then(function () {
                return $q.when(workflow);
            });
        } else {
            return greyscaleProductWorkflowApi.add(workflow).then(function (response) {
                workflow.id = response.id;
                return $q.when(workflow);
            });
        }
    }
    
    function _saveProductWorkflowSteps(workflowId, steps) {
        return greyscaleProductWorkflowApi.workflow(workflowId).stepsListUpdate(steps);
    }
    
    function _getSurveys() {
        return _dicts.surveys;
    }
    
    function _getStatus() {
        return greyscaleGlobals.productStates;
    }
    
    var _const = {
        STATUS_PLANNING: 0,
        STATUS_STARTED: 1,
        STATUS_SUSPENDED: 2,
        STATUS_CANCELLED: 4
    };
    function _getDisabledStatus(item, rec) {
        return item.id !== _const.STATUS_PLANNING && item.id !== _const.STATUS_CANCELLED && _planningNotFinish(rec);
    }
    
    function _planningNotFinish(product) {
        return !product.uoas || !product.uoas.length || !product.surveyId ||
                !product.workflowSteps || !product.workflowSteps.length || !product.tasks || !product.tasks.length;
    }
    
    function _errHandler(err, operation) {
        var msg = _table.formTitle + ' ' + operation + ' error';
        greyscaleUtilsSrv.errorMsg(err, msg);
    }
    
    function _loadProductExtendedData(product) {
        if (!product || !product.id) {
            return $q.when(product);
        }
        
        var extendedProduct = angular.copy(product);
        var reqs = {
            uoas: greyscaleProductApi.product(product.id).uoasList(),
            tasks: greyscaleProductApi.product(product.id).tasksList(),
        };
        if (product.workflow && product.workflow.id) {
            reqs.workflowSteps = greyscaleProductWorkflowApi
                    .workflow(product.workflow.id).stepsList();
        }
        return $q.all(reqs).then(function (promises) {
            angular.extend(extendedProduct, promises);
            return extendedProduct;
        });
    }
    
    function _moveNextStep(task) {
        greyscaleProductApi.product(task.productId).taskMove(task.uoaId)
                .then(function () {
            tasksTable.tableParams.reload();
        })
                .catch(function (err) {
            greyscaleUtilsSrv.errorMsg(err, 'Step moving');
        });
    }
    
    function _notifyUser(task) {
        greyscaleModalsSrv.sendNotification(task.user, {});
    }
    
    function _getData(productId) {
        var reqs = {
            tasks: greyscaleProductApi.product(productId).tasksList()
        };
        return $q.all(reqs);
    }
    
    function _getFlaggedCount(tasksData) {
        var flaggedSurveys = [];
        angular.forEach(tasksData, function (task) {
            if (task.status === 'completed' || !task.flagged) {
                return;
            }
            if (!~flaggedSurveys.indexOf(task.uoaId)) {
                flaggedSurveys.push(task.uoaId);
            }
        });
        return flaggedSurveys.length;
    }

});
