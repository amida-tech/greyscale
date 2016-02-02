'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleProjectProductsTbl', function ($q, _,
        greyscaleProjectApi,
        greyscaleProductApi,
        greyscaleModalsSrv,
        greyscaleUtilsSrv,
        greyscaleProductWorkflowApi,
        $state,
        inform) {

        var tns = 'PRODUCTS.TABLE.';

        var _dicts = {
            surveys: []
        };

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
            title: tns + 'SURVEY',
            show: true,
            sortable: 'surveyId',
            dataFormat: 'option',
            //dataRequired: true,
            dataSet: {
                getData: _getSurveys,
                keyField: 'id',
                valField: 'name'
            },
            link: {
                target: '_blank',
                href: '/survey/{{item.id}}'
                    //state: 'projects.setup({projectId: item.id})'
            }
        }, {
            field: 'workflow.name',
            sortable: 'workflow.name',
            title: tns + 'WORKFLOW',
            show: true,
            dataHide: true
        }, {
            title: tns + 'SETTINGS',
            show: true,
            dataFormat: 'action',
            actions: [{
                title: tns + 'UOAS',
                class: 'info',
                handler: _editProductUoas
            }, {
                title: tns + 'WORKFLOW',
                class: 'info',
                handler: _editProductWorkflow
            }, {
                title: tns + 'TASKS',
                class: 'info',
                handler: _editProductTasks
            }]
        }, {
            show: true,
            dataFormat: 'action',
            actions: [{
                title: '',
                icon: 'fa-pencil',
                class: 'info',
                handler: _editProduct
            }, {
                title: '',
                icon: 'fa-trash',
                class: 'danger',
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
            add: {
                title: 'COMMON.CREATE',
                handler: _editProduct
            }
        };

        function _getProjectId() {
            return _table.dataFilter.projectId;
        }

        function _getData() {
            var projectId = _getProjectId();
            if (!projectId) {
                return $q.reject();
            } else {
                var req = {
                    surveys: greyscaleProjectApi.surveysList(projectId),
                    products: greyscaleProjectApi.productsList(projectId)
                };
                return $q.all(req).then(function (promises) {
                    _dicts.surveys = promises.surveys;
                    return promises.products;
                });
            }
        }

        function _getSurveys() {
            return _dicts.surveys;
        }

        function _editProduct(product) {
            var op = 'editing';
            greyscaleModalsSrv.editRec(product, _table)
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
            greyscaleProductApi.delete(product.id)
                .then(_reload)
                .catch(function (err) {
                    inform.add('Product delete error: ' + err);
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

        function _errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
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

        return _table;
    });
