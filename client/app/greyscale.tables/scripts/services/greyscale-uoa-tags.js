/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaTagsTbl', function ($q, greyscaleUtilsSrv, greyscaleProfileSrv, greyscaleModalsSrv,
        greyscaleLanguageApi, greyscaleUoaTagApi, greyscaleUoaClassTypeApi, $rootScope) {

        var tns = 'UOA_TAGS.';

        var dicts = {
            languages: [],
            uoaClassTypes: []
        };

        var resDescr = [{
            field: 'id',
            title: 'ID',
            show: true,
            sortable: 'id',
            dataFormat: 'text',
            dataRequired: true,
            dataReadOnly: 'both'
        }, {
            field: 'name',
            title: tns + 'NAME',
            show: true,
            sortable: 'name',
            dataFormat: 'text',
            dataRequired: true
        }, {
            field: 'description',
            title: tns + 'DESCRIPTION',
            show: true,
            dataFormat: 'text',
            dataRequired: true
        }, {
            field: 'classTypeId',
            title: tns + 'CLASSIFICATION_TYPE',
            show: true,
            sortable: 'classTypeId',
            dataFormat: 'option',
            dataRequired: true,
            dataSet: {
                getData: getClassTypes,
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
                handler: _editUoaTag
            }, {
                icon: 'fa-trash',
                tooltip: 'COMMON.DELETE',
                handler: _delRecord
            }]
        }];

        var _table = {
            title: tns + 'TAGS',
            formTitle: tns + 'TAG',
            icon: 'fa-table',
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            add: {
                handler: _addUoaTag
            },
            update: {
                uoaClassTypes: _updateUoaClassTypes
            },
            onReload: _broadcastUpdate
        };

        function _broadcastUpdate() {
            $rootScope.$broadcast('update-uoaTags', {
                uoaTags: dicts.uoaTags
            });
        }

        function _updateUoaClassTypes(uoaClassTypes) {
            if (uoaClassTypes) {
                dicts.uoaClassTypes = uoaClassTypes;
            }
        }

        function _editUoaTag(_uoaTag) {
            var op = 'UPDATE';
            return greyscaleUoaTagApi.get(_uoaTag)
                .then(function (uoaTag) {
                    return greyscaleModalsSrv.editRec(uoaTag, _table);
                })
                .then(function (uoaTag) {
                    return greyscaleUoaTagApi.update(uoaTag);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _addUoaTag() {
            var op = 'ADD';
            return greyscaleModalsSrv.editRec(null, _table)
                .then(function (uoaTag) {
                    return greyscaleUoaTagApi.add(uoaTag);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _delRecord(tag) {
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                tag: tag,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleUoaTagApi.delete(tag.id)
                    .then(reloadTable)
                    .catch(function (err) {
                        errHandler(err, 'DELETE');
                    });
            });
        }

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoaTags: greyscaleUoaTagApi.list(),
                    uoaClassTypes: greyscaleUoaClassTypeApi.list(),
                    languages: greyscaleLanguageApi.list()
                };
                return $q.all(req).then(function (promises) {
                    for (var p = 0; p < promises.uoaTags.length; p++) {
                        greyscaleUtilsSrv.prepareFields(promises.uoaTags, resDescr);
                    }
                    dicts.languages = promises.languages;
                    dicts.uoaClassTypes = promises.uoaClassTypes;
                    dicts.uoaTags = promises.uoaTags;
                    return promises.uoaTags;
                });
            });
        }

        function getLanguages() {
            return dicts.languages;
        }

        function getClassTypes() {
            return dicts.uoaClassTypes;
        }

        function reloadTable() {
            _table.tableParams.reload();
        }

        function errHandler(err, action) {
            greyscaleUtilsSrv.apiErrorMessage(err, action, _table.formTitle);
        }

        return _table;
    });
