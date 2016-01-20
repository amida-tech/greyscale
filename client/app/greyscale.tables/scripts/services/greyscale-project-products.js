'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleProjectProductsTbl', function ($q,
                                                      greyscaleProjectApi,
                                                      greyscaleProductApi,
                                                      greyscaleModalsSrv,
                                                      greyscaleUtilsSrv,
                                                      inform) {

        var _dicts = {
            surveys: []
        };

        var _cols = [{
            field: 'title',
            title: 'Name',
            show: true,
            sortable: 'title',
            dataRequired: true
        }, {
            field: 'description',
            title: 'Description',
            show: true,
            dataRequired: true
        }, {
            field: 'surveyId',
            title: 'Survey',
            show: true,
            sortable: 'surveyId',
            dataFormat: 'option',
            //dataRequired: true,
            dataSet: {
                getData: _getSurveys,
                keyField: 'id',
                valField: 'name'
            }
        }, {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                title: 'Workflow',
                class: 'info',
                handler: _showProductWorkflow
            }, {
                title: 'UoAs',
                class: 'info',
                handler: _showProductUoas
            }, {
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
            formTitle: 'Product',
            add: {
                title: 'add',
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
                return $q.all(req).then(function(promises){
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

        function _showProductUoas(product) {
            return greyscaleModalsSrv.productUoas(product);
        }

        function _showProductWorkflow(product) {
            greyscaleModalsSrv.productWorkflow(product);
        }

        function _errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
