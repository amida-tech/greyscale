/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaClassTypes', function ($q, greyscaleGlobals, greyscaleUtilsSrv,
                                                 greyscaleProfileSrv, greyscaleModalsSrv,
                                                 greyscaleLanguageSrv, greyscaleUoaClassTypeSrv,
                                                 $log) {

        var dicts = {
            languages: []
        };
        var recDescr = [
            {
                field: 'id',
                title: 'ID',
                show: true,
                sortable: 'id',
                dataFormat: 'text',
                dataRequired: true,
                dataReadOnly: true
            },
            {
                field: 'name',
                title: 'Name',
                show: true,
                sortable: 'name',
                dataFormat: 'text',
                dataRequired: true
            },
            {
                field: 'description',
                title: 'Description',
                show: true,
                dataFormat: 'text'
            },
            {
                field: 'langId',
                title: 'Original language',
                show: true,
                sortable: 'langId',
                dataFormat: 'option',
                dataReadOnly: 'edit',
                dataRequired: true,
                dataSet: {
                    getData: getLanguages,
                    keyField: 'id',
                    valField: 'name'
                }
            },
            {
                field: '',
                title: '',
                show: true,
                dataFormat: 'action',
                actions: [
                    {
                        icon: 'fa-pencil',
                        class: 'info',
                        handler: _editUoaClassType
                    },
                    {
                        icon: 'fa-trash',
                        class: 'danger',
                        handler: _delRecord
                    }
                ]
            }
        ];

        var _table = {
            title: 'Unit of Analysis Classification Types',
            icon: 'fa-table',
            sorting: {id: 'asc'},
            pageLength: 5,
            cols: recDescr,
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _addUoaClassType
            }
        };

        function _editUoaClassType(_uoaClassType) {
            var op = 'editing';
            return greyscaleUoaClassTypeSrv.get(_uoaClassType)
                .then(function (uoaClassType) {
                    return greyscaleModalsSrv.editUoaClassType(uoaClassType, _table);
                })
                .then(function (uoaClassType) {
                    return greyscaleUoaClassTypeSrv.update(uoaClassType);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _addUoaClassType(_uoaClassType) {
            var op = 'adding';
            return greyscaleModalsSrv.editUoaClassType(_uoaClassType, _table)
                .then(function (uoaClassType) {
                    return greyscaleUoaClassTypeSrv.add(uoaClassType);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _delRecord(item) {
            greyscaleUoaClassTypeSrv.delete(item.id)
                .then(reloadTable)
                .catch(function (err) {
                    errHandler(err, 'deleting');
                });
        }

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoaClassTypes: greyscaleUoaClassTypeSrv.list(),
                    languages: greyscaleLanguageSrv.list()
                };
                return $q.all(req).then(function (promises) {
                    for (var p = 0; p < promises.uoaClassTypes.length; p++) {
                        greyscaleUtilsSrv.prepareFields(promises.uoaClassTypes, recDescr);
                    }
                    dicts.languages = promises.languages;

                    return promises.uoaClassTypes;
                });
            });
        }

        function getLanguages() {
            return dicts.languages;
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
