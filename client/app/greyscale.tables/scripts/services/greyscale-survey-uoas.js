'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleSurveyUoas', function ($q, greyscaleSurveySrv, greyscaleModalsSrv, inform, $log, $location) {

        var dicts = {
            languages: [],
            uoaTypes: []
        };

        var resDescr = [{
                field: 'name',
                title: 'Name',
                show: true,
                sortable: 'name',
                dataFormat: 'text',
                dataRequired: true
            }, {
                field: 'description',
                title: 'Description',
                show: true,
                dataFormat: 'text',
                dataRequired: true
            }, {
                field: 'shortName',
                title: 'Short Name',
                show: true,
                dataFormat: 'text',
                dataRequired: true,
                sortable: 'shortName'
            },
            /*
             field: 'HASC',
             */
            {
                field: 'unitOfAnalysisType',
                title: 'Type',
                show: true,
                sortable: 'unitOfAnalysisType',
                dataFormat: 'option',
                dataRequired: true,
                dataSet: {
                    getData: getUoaTypes,
                    keyField: 'id',
                    valField: 'name'
                }
            }, {
                field: '',
                title: '',
                show: true,
                dataFormat: 'action',
                actions: [{
                    icon: 'fa-trash',
                    class: 'danger',
                    handler: _delRecord
                }]
            }, {
                show: true,
                selectable: true
            }
        ];

        var _table = {
            title: 'Unit of Analysis',
            icon: 'fa-table',
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _addUoa
            }
        };

        function _editUoa(_uoa) {
            var op = 'editing';
            return greyscaleUoaSrv.get(_uoa)
            .then(function (uoa) {
                return greyscaleModalsSrv.editRec(uoa, _table);
            })
            .then(function (uoa) {
                return greyscaleUoaSrv.update(uoa);
            })
            .then(reloadTable)
            .catch(function (err) {
                return errHandler(err, op);
            });
        }

        function _addUoa() {
            var op = 'adding';
            return greyscaleModalsSrv.editRec(null, _table)
            .then(function (uoa) {
                return greyscaleUoaSrv.add(uoa);
            })
            .then(reloadTable)
            .catch(function (err) {
                return errHandler(err, op);
            });
        }

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoas: greyscaleUoaSrv.list(),
                    uoaTypes: greyscaleUoaTypeSrv.list(),
                    languages: greyscaleLanguageSrv.list()
                };
                return $q.all(req).then(function (promises) {
                    for (var p = 0; p < promises.uoas.length; p++) {
                        greyscaleUtilsSrv.prepareFields(promises.uoas, resDescr);
                    }
                    dicts.languages = promises.languages;
                    dicts.uoaTypes = promises.uoaTypes;

                    return promises.uoas;
                });
            });
        }

        function _delRecord(item) {
            greyscaleUoaSrv.delete(item.id)
            .then(reloadTable)
            .catch(function (err) {
                errHandler(err, 'deleting');
            });
        }

        function getLanguages() {
            return dicts.languages;
        }

        function getVisibilities() {
            return dicts.visibility;
        }

        function getStatuses() {
            return dicts.status;
        }

        function getUoaTypes() {
            return dicts.uoaTypes;
        }

        function reloadTable() {
            _table.tableParams.reload();
        }

        function errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
