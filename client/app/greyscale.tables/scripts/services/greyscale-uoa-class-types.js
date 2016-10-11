/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaClassTypesTbl', function ($q, greyscaleUtilsSrv, greyscaleProfileSrv, greyscaleModalsSrv,
        greyscaleLanguageApi, greyscaleUoaClassTypeApi, $rootScope) {

        var tns = 'UOA_TAGS.';

        var dicts = {
            languages: []
        };
        var recDescr = [{
            field: 'id',
            title: 'ID',
            show: true,
            sortable: 'id',
            dataFormat: 'text',
            dataReadOnly: true
        }, {
            field: 'name',
            title: tns + 'TYPE_NAME',
            show: true,
            sortable: 'name',
            dataFormat: 'text',
            dataRequired: true
        }, {
            field: 'description',
            title: tns + 'TYPE_DESCRIPTION',
            show: true,
            dataFormat: 'text'
        }, {
            field: 'langId',
            title: 'COMMON.ORIGINAL_LANGUAGE',
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
                tooltip: 'COMMON.EDIT',
                handler: _editUoaClassType
            }, {
                icon: 'fa-trash',
                tooltip: 'COMMON.DELETE',
                handler: _delRecord
            }]
        }];

        var _table = {
            title: tns + 'TAG_TYPES',
            formTitle: tns + 'TAG_TYPE',
            icon: 'fa-table',
            sorting: {
                id: 'asc'
            },
            cols: recDescr,
            dataPromise: _getData,
            add: {
                handler: _addUoaClassType
            },
            onReload: _broadcastUpdate
        };

        function _broadcastUpdate() {
            $rootScope.$broadcast('update-uoaClassTypes', {
                uoaClassTypes: dicts.uoaClassTypes
            });
        }

        function _editUoaClassType(_uoaClassType) {
            var op = 'UPDATE';
            return greyscaleUoaClassTypeApi.get(_uoaClassType)
                .then(function (uoaClassType) {
                    return greyscaleModalsSrv.editRec(uoaClassType, _table);
                })
                .then(function (uoaClassType) {
                    return greyscaleUoaClassTypeApi.update(uoaClassType);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _addUoaClassType(_uoaClassType) {
            var op = 'ADD';
            return greyscaleModalsSrv.editRec(_uoaClassType, _table)
                .then(function (uoaClassType) {
                    return greyscaleUoaClassTypeApi.add(uoaClassType);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _delRecord(tagType) {
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM_TYPE',
                tagType: tagType,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleUoaClassTypeApi.delete(tagType.id)
                    .then(reloadTable)
                    .catch(function (err) {
                        errHandler(err, 'DELETE');
                    });
            });
        }

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoaClassTypes: greyscaleUoaClassTypeApi.list(),
                    languages: greyscaleLanguageApi.list()
                };
                return $q.all(req).then(function (promises) {
                    for (var p = 0; p < promises.uoaClassTypes.length; p++) {
                        greyscaleUtilsSrv.prepareFields(promises.uoaClassTypes, recDescr);
                    }
                    dicts.languages = promises.languages;

                    dicts.uoaClassTypes = promises.uoaClassTypes;

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

        function errHandler(err, action) {
            greyscaleUtilsSrv.apiErrorMessage(err, action, _table.formTitle);
        }

        return _table;
    });
