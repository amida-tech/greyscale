'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleProjectProductsTbl', function ($q, _, greyscaleProjectApi, greyscaleSurveyApi,
        greyscaleProductApi, greyscaleModalsSrv, greyscaleUtilsSrv, greyscaleProductWorkflowApi, greyscaleGlobals,
        $state, i18n, greyscaleProductSrv) {

        var tns = 'PRODUCTS.TABLE.';

        var _editProductMode;

        var _dicts = {
            surveys: []
        };

        var _const = {
            STATUS_PLANNING: 0,
            STATUS_STARTED: 1,
            STATUS_SUSPENDED: 2,
            STATUS_CANCELLED: 4
        };

        var _statusIcons = {},
            dlgPublish = greyscaleGlobals.dialogs.policyPublish;

        _statusIcons[_const.STATUS_STARTED] = 'fa-pause';
        _statusIcons[_const.STATUS_SUSPENDED] = 'fa-play';

        var _cols = [
            /*{
             field: 'title',
             title: tns + 'TITLE',
             show: true,
             sortable: 'title',
             dataRequired: true
             },*/
            {
                field: 'description',
                title: tns + 'DESCRIPTION',
                show: true,
                dataRequired: true,
                dataFormat: 'textarea'
            }, {
                field: 'workflow.name',
                sortable: 'workflow.name',
                title: tns + 'WORKFLOW',
                show: true,
                cellTemplate: '{{cell}}<span ng-if="!cell" class="action" translate="' + tns +
                    'CREATE_WORKFLOW"></span>',
                link: {
                    handler: _editProductWorkflow
                },
                dataHide: true
            }, {
                show: true,
                dataFormat: 'action',
                dataHide: true,
                actions: [{
                    getIcon: _getStatusIcon,
                    getTooltip: _getStartOrPauseProductTooltip,
                    class: 'info',
                    handler: _startOrPauseProduct
                }]
            }, {
                field: 'status',
                show: true,
                sortable: 'status',
                title: tns + 'STATUS',
                dataFormat: 'option',
                dataNoEmptyOption: true,
                cellTemplate: '<a ui-sref="pmProductDashboard({productId:row.id})">{{option.name}}</a>',
                dataRequired: true,
                dataSet: {
                    getData: _getStatus,
                    keyField: 'id',
                    valField: 'name',
                    getDisabled: _getDisabledStatus
                }
            }, {
                title: tns + 'SETTINGS',
                show: true,
                textLeft: true,
                dataFormat: 'action',
                dataHide: true,
                actions: [{
                        title: tns + 'UOAS',
                        class: 'info',
                        handler: _editProductUoas,
                        show: _showUoaSetting
                    }, {
                        title: tns + 'TASKS',
                        class: 'info',
                        handler: _editProductTasks
                    }
                    /*, {
                     title: tns + 'INDEXES',
                     class: 'info',
                     handler: _editProductIndexes
                     }*/
                ]
            }, {
                field: 'surveyId',
                title: tns + 'SURVEY_POLICY',
                show: true,
                sortable: 'survey.title',
                dataFormat: 'option',
                cellTemplateUrl: 'project-setup-products-survey.html',
                dataPlaceholder: tns + 'SELECT_SURVEY',
                dataRequired: true,
                formPosition: -1,
                dataSet: {
                    getData: _getSurveys,
                    keyField: 'id',
                    valField: 'title',
                    groupBy: function (item) {
                        return i18n.translate(tns + (item.policyId ? 'POLICIES' : 'SURVEYS'));
                    }
                },
                link: {
                    //target: '_blank',
                    //href: '/survey/{{item.id}}'
                    state: function (item) {
                            return item.policy ? 'policy.edit({id: item.policy.surveyId})' :
                                'projects.setup.surveys.edit({surveyId: item.survey.id})';
                        }
                        //state: 'projects.setup.surveys.edit({projectId: item.projectId, surveyId: item.surveyId})'
                }
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
            }
        ];

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

        // function _getProjectId() {
        //     return _table.dataFilter.projectId;
        // }

        function _getData() {
            // var projectId = _getProjectId();
            // if (!projectId) {
            //     return $q.reject('');
            // } else {
            var req = {
                surveys: greyscaleSurveyApi.list(),
                products: greyscaleProjectApi.productsList( /*projectId*/ )
            };
            return $q.all(req).then(function (resp) {
                _dicts.surveys = resp.surveys;
                return _setAddData(resp.products);
            });
            // }
        }

        function _setAddData(products) {
            var _survey;
            angular.forEach(products, function (product) {
                if (product.survey) {
                    product.surveyId = product.survey ? product.survey.id : null;
                    _survey = _.find(_dicts.surveys, {
                        id: product.surveyId
                    });
                    if (_survey) {
                        _survey.products = _survey.products || [];
                        _survey.products.push(product.id);
                    }
                }
            });
            return products;
        }

        function _getStatus() {
            return greyscaleGlobals.productStates;
        }

        function _getSurveys() {
            return !_editProductMode ? _dicts.surveys : _.filter(_dicts.surveys, function (survey) {
                return _editProductMode.surveyId === survey.id || !survey.policyId || !survey.products ||
                    !survey.products.length;
            });
        }

        function _editProduct(product) {
            _editProductMode = product || {};
            var op = 'editing';
            return _loadProductExtendedData(product)
                .then(function (extendedProduct) {
                    var _editTable = angular.copy(_table);
                    return greyscaleModalsSrv.editRec(extendedProduct, _editTable);
                })
                .then(function (newProduct) {
                    if (newProduct.id) {
                        return greyscaleProductApi.update(newProduct);
                    } else {
                        op = 'adding';
                        newProduct.matrixId = 4;
                        return greyscaleProductApi.add(newProduct);
                    }
                })
                .finally(function () {
                    _editProductMode = undefined;
                })
                .then(_reload)
                .catch(function (err) {
                    return _errHandler(err, op);
                });
        }

        function _removeProduct(product) {
            return greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                product: product,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleProductApi.delete(product.id)
                    .then(_reload)
                    .catch(function (err) {
                        return _errHandler(err, 'delete');
                    });
            });
        }

        function _reload() {
            if (_table.tableParams) {
                _table.tableParams.reload();
            }
        }

        function _editProductUoas(product) {
            return greyscaleModalsSrv.productUoas(product);
        }

        function _editProductWorkflow(product) {
            var modalData = {
                product: product
            };
            return greyscaleModalsSrv.productWorkflow(modalData)
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

        /*
         function _editProductIndexes(product) {
         $state.go('projects.setup.indexes', {
         productId: product.id,
         product: product
         });
         }
         */
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
            return $q.all(reqs).then(function (resp) {
                angular.extend(extendedProduct, resp);
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
            return !product.uoas || !product.uoas.length || !product.surveyId || !product.workflowSteps ||
                !product.workflowSteps.length || !product.tasks || !product.tasks.length;
        }

        function _getDisabledStatus(item, rec) {
            return item.id !== _const.STATUS_PLANNING && item.id !== _const.STATUS_CANCELLED &&
                _planningNotFinish(rec);
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
            var op = 'changing status',
                _publishDlg = $q.resolve(false),
                _product = angular.copy(product),
                newStatus;

            switch (product.status) {
            case _const.STATUS_STARTED:
                newStatus = _const.STATUS_SUSPENDED;
                break;
            case _const.STATUS_SUSPENDED:
                newStatus = _const.STATUS_STARTED;
                if (greyscaleProductSrv.needAcionSecect(_product,_product.uoas)) {
                    _publishDlg = greyscaleModalsSrv.dialog(dlgPublish);
                }
                break;
            }

            if (newStatus !== undefined) {
                _product.status = newStatus;
                _publishDlg.then(function (action) {
                    return greyscaleProductApi.update(_product)
                        .then(_reload)
                        .then(function () {
                            if (action && greyscaleProductSrv.needAcionSecect(_product,_product.uoas)) {
                                return greyscaleProductSrv.doAction(_product.id, _product.uoas[0], action);
                            } else {
                                return true;
                            }
                        })
                        .catch(function (err) {
                            return errHandler(err, op);
                        });
                });
            }
        }

        function _showUoaSetting(row) {
            return !row.policy;
        }

        function errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        _table.methods = {
            editProductTasks: _editProductTasks,
            editProduct: _editProduct,
            removeProduct: _removeProduct,
            editProductWorkflow: _editProductWorkflow,
            fillSurvey: function () {
                return greyscaleSurveyApi.list().then(function (surveys) {
                    _dicts.surveys = surveys;
                });
            }
        };

        return _table;
    });
