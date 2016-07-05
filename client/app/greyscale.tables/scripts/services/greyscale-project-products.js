'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleProjectProductsTbl', function ($q, _,
        greyscaleProjectApi,
        greyscaleProductApi,
        greyscaleModalsSrv,
        greyscaleUtilsSrv,
        greyscaleProductWorkflowApi,
        greyscaleGlobals,
        $state,
        inform, i18n) {

        var tns = 'PRODUCTS.TABLE.';

        var _dicts = {
            surveys: []
        };

        var _const = {
            STATUS_PLANNING: 0,
            STATUS_STARTED: 1,
            STATUS_SUSPENDED: 2,
            STATUS_CANCELLED: 4
        };

        var _statusIcons = {};
        _statusIcons[_const.STATUS_STARTED] = 'fa-pause';
        _statusIcons[_const.STATUS_SUSPENDED] = 'fa-play';

        var _cols = [{
            field: 'title',
            title: tns + 'TITLE',
            show: true,
            sortable: 'title',
            dataRequired: true
        }, {
            field: 'description',
            title: tns + 'DESCRIPTION',
            show: true,
            dataRequired: true,
            dataFormat: 'textarea'
        }, {
            field: 'surveyId',
            title: tns + 'SURVEY_POLICY',
            show: true,
            sortable: 'surveyId',
            dataFormat: 'option',
            cellTemplate: '<i class="fa" ng-class="{\'fa-file\':row.policyId, \'fa-list\': !row.policyId}"></i> <span ng-if="option.id">{{option.title}} <small>(<span ng-show="option.isDraft" translate="SURVEYS.IS_DRAFT"></span><span ng-show="!option.isDraft" translate="SURVEYS.IS_COMPLETE"></span>)</small></span>',
            //dataRequired: true,
            dataSet: {
                getData: _getSurveys,
                keyField: 'id',
                valField: 'title',
                groupBy: function (item) {
                    return i18n.translate(tns + (item.policyId ?  'POLICIES' : 'SURVEYS'));
                }
            },
            link: {
                //target: '_blank',
                //href: '/survey/{{item.id}}'
                state: function (item) {
                        return item.policyId ? 'policy.edit({id: item.surveyId})' :
                            'projects.setup.surveys.edit({projectId: item.projectId, surveyId: item.surveyId})';
                    }
                    //state: 'projects.setup.surveys.edit({projectId: item.projectId, surveyId: item.surveyId})'
            }
        }, {
            field: 'workflow.name',
            sortable: 'workflow.name',
            title: tns + 'WORKFLOW',
            show: true,
            cellTemplate: '{{cell}}<span ng-if="!cell" class="action" translate="' + tns + 'CREATE_WORKFLOW"></span>',
            link: {
                handler: _editProductWorkflow
            },
            dataHide: true
        }, {
            field: 'status',
            show: true,
            sortable: 'status',
            title: tns + 'STATUS',
            dataFormat: 'option',
            dataNoEmptyOption: true,
            dataSet: {
                getData: _getStatus,
                keyField: 'id',
                valField: 'name',
                getDisabled: _getDisabledStatus
            }
        }, {
            title: tns + 'SETTINGS',
            show: true,
            dataFormat: 'action',
            dataHide: true,
            actions: [{
                title: '',
                getIcon: _getStatusIcon,
                getTooltip: _getStartOrPauseProductTooltip,
                class: 'info',
                handler: _startOrPauseProduct
            }, {
                title: tns + 'UOAS',
                class: 'info',
                handler: _editProductUoas
            }, {
                title: tns + 'TASKS',
                class: 'info',
                handler: _editProductTasks
            }, {
                title: tns + 'INDEXES',
                class: 'info',
                handler: _editProductIndexes
            }]
        }, {
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-pencil',
                tooltip: 'COMMON.EDIT',
                handler: _editProduct
            }, {
                icon: 'fa-trash',
                tooltip: 'COMMON.DELETE',
                handler: _removeProduct
            }]
        }];

        var _table = {
            title: '',
            cols: _cols,
            sorting: {
                'id': 'asc'
            },
            dataPromise: _getData,
            dataFilter: {},
            formTitle: tns + 'PRODUCT',
            formWarning: _getFormWarning,
            add: {
                handler: _editProduct
            }
        };

        function _getProjectId() {
            return _table.dataFilter.projectId;
        }

        function _getData() {
            var projectId = _getProjectId();
            if (!projectId) {
                return $q.reject('');
            } else {
                var req = {
                    surveys: greyscaleProjectApi.surveysList(projectId),
                    products: greyscaleProjectApi.productsList(projectId)
                };
                return $q.all(req).then(function (promises) {
                    _dicts.surveys = promises.surveys;
                    return _setPolicyId(promises.products);
                });
            }
        }

        function _setPolicyId(products) {
            angular.forEach(products, function (product) {
                var survey = _.find(_dicts.surveys, {
                    id: product.surveyId
                });
                if (survey) {
                    product.policyId = survey.policyId;
                }
            });
            return products;
        }

        function _getStatus() {
            return greyscaleGlobals.productStates;
        }

        function _getSurveys() {
            return _dicts.surveys;
        }

        function _editProduct(product) {
            var op = 'editing';
            _loadProductExtendedData(product)
                .then(function (extendedProduct) {
                    var _editTable = angular.copy(_table);
                    if (extendedProduct) {

                    }
                    return greyscaleModalsSrv.editRec(extendedProduct, _editTable);
                })
                .then(function (newProduct) {
                    if (newProduct.id) {
                        return greyscaleProductApi.update(newProduct);
                    } else {
                        op = 'adding';
                        newProduct.projectId = _getProjectId();
                        newProduct.matrixId = 4;
                        return greyscaleProductApi.add(newProduct);
                    }
                })
                .then(_reload)
                .catch(function (err) {
                    return _errHandler(err, op);
                });
        }

        function _removeProduct(product) {
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                product: product,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleProductApi.delete(product.id)
                    .then(_reload)
                    .catch(function (err) {
                        inform.add('Product delete error: ' + err);
                    });
            });
        }

        function _reload() {
            _table.tableParams.reload();
        }

        function _editProductUoas(product) {
            return greyscaleModalsSrv.productUoas(product);
        }

        function _editProductWorkflow(product) {
            greyscaleModalsSrv.productWorkflow(product)
                .then(function (data) {
                    return _saveWorkflowAndSteps(product, data);
                })
                .then(_reload);
        }

        function _editProductTasks(product) {
            $state.go('projects.setup.tasks', {
                productId: product.id,
                product: product
            });
        }

        function _editProductIndexes(product) {
            $state.go('projects.setup.indexes', {
                productId: product.id,
                product: product
            });
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
                tasks: greyscaleProductApi.product(product.id).tasksList()
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

        function _planningNotFinish(product) {
            return !product.uoas || !product.uoas.length || !product.surveyId ||
                !product.workflowSteps || !product.workflowSteps.length || !product.tasks || !product.tasks.length;
        }

        function _getDisabledStatus(item, rec) {
            return item.id !== _const.STATUS_PLANNING && item.id !== _const.STATUS_CANCELLED && _planningNotFinish(rec);
        }

        function _getFormWarning(product) {
            var warning;
            if (product.id && _planningNotFinish(product)) {
                warning = i18n.translate(tns + 'PLANNING_NOT_FINISH');
            }
            return warning;
        }

        function _getStatusIcon(product) {
            return _statusIcons[product.status] ? _statusIcons[product.status] : '';
        }

        function _getStartOrPauseProductTooltip(product) {
            var action, tooltip;
            if (product.status === _const.STATUS_SUSPENDED) {
                action = 'START';
            } else if (product.status === _const.STATUS_STARTED) {
                action = 'PAUSE';
            }
            if (action) {
                tooltip = tns + action + '_PRODUCT';
            }
            return tooltip;
        }

        function _startOrPauseProduct(product) {
            var op = 'changing status';
            var status = product.status;
            var setStatus;
            if (status === _const.STATUS_STARTED) {
                setStatus = _const.STATUS_SUSPENDED;
            } else if (status === _const.STATUS_SUSPENDED) {
                setStatus = _const.STATUS_STARTED;
            }
            if (setStatus !== undefined) {
                var saveProject = angular.copy(product);
                saveProject.status = setStatus;
                greyscaleProductApi.update(saveProject)
                    .then(_reload)
                    .catch(function (err) {
                        return errHandler(err, op);
                    });
            }
        }

        function errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
