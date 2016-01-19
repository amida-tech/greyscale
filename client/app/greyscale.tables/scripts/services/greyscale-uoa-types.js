/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaTypes', function ($q, greyscaleUtilsSrv, greyscaleProfileSrv, greyscaleModalsSrv,
        greyscaleUoaTypeApi, greyscaleLanguageSrv) {

        var dicts = {
            languages: []
        };

        var recDescr = [{
            field: 'id',
            title: 'ID',
            show: true,
            sortable: 'id',
            dataFormat: 'text',
            dataRequired: true,
            dataReadOnly: true
        }, {
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
        }, {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-pencil',
                class: 'info',
                handler: _editUoaType
            }, {
                icon: 'fa-trash',
                class: 'danger',
                handler: _delRecord
            }]
        }];

        var _table = {
            title: 'Unit Types',
            icon: 'fa-table',
            sorting: {
                id: 'asc'
            },
            pageLength: 5,
            cols: recDescr,
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _addUoaType
            }
        };

        function _editUoaType(_uoaType) {
            var op = 'editing';
            return greyscaleUoaTypeApi.get(_uoaType)
                .then(function (uoaType) {
                    return greyscaleModalsSrv.editRec(uoaType, _table);
                })
                .then(function (uoaType) {
                    return greyscaleUoaTypeApi.update(uoaType);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _addUoaType() {
            var op = 'adding';
            return greyscaleModalsSrv.editRec(null, _table)
                .then(function (uoaType) {
                    return greyscaleUoaTypeApi.add(uoaType);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _delRecord(item) {
            greyscaleUoaTypeApi.delete(item.id)
                .then(reloadTable)
                .catch(function (err) {
                    errHandler(err, 'deleting');
                });
        }

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoaTypes: greyscaleUoaTypeApi.list(),
                    languages: greyscaleLanguageSrv.list()
                };
                return $q.all(req).then(function (promises) {
                    for (var p = 0; p < promises.uoaTypes.length; p++) {
                        greyscaleUtilsSrv.prepareFields(promises.uoaTypes, recDescr);
                    }
                    dicts.languages = promises.languages;

                    return promises.uoaTypes;
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
