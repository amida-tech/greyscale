'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleProjectProducts', function ($q, greyscaleProjectSrv, greyscaleProductSrv,
                                                   greyscaleModalsSrv, greyscaleUtilsSrv,
                                                   inform, $log, $location) {

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
                handler: _editWorkflow
            }, {
                title: 'UoAs',
                class: 'info',
                handler: _editUoas
            }, {
                title: 'View',
                class: 'info',
                handler: _viewSurvey
            }, {
                title: '',
                icon: 'fa-pencil',
                class: 'info',
                handler: _editProduct
            }, {
                title: '',
                icon: 'fa-trash',
                class: 'danger',
                handler: _removeSurvey
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
                    surveys: greyscaleProjectSrv.surveysList(projectId),
                    products: greyscaleProjectSrv.productsList(projectId)
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
                        return greyscaleProductSrv.update(newProduct);
                    } else {
                        op = 'adding';
                        newProduct.projectId = _getProjectId();
                        newProduct.matrixId = 4;
                        return greyscaleProductSrv.add(newProduct);
                    }
                })
                .then(_reload)
                .catch(function (err) {
                    return _errHandler(err, op);
                });
        }

        function _removeSurvey(_survey) {
            //greyscaleSurveySrv.delete(_survey).then(_reload).catch(function (err) {
            //    inform.add('Survey delete error: ' + err);
            //});
        }

        function _viewSurvey(_survey) {
            var url = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/interviewRenderer/#' + _survey.id;
            window.location = url;
        }

        function _reload() {
            _table.tableParams.reload();
        }

        function _editUoas(survey) {
            greyscaleModalsSrv.surveyUoas(survey.id)
                ;
        }

        function _editWorkflow() {

        }

        function _errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
