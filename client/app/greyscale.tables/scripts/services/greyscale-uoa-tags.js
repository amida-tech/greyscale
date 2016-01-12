/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaTags', function ($q, greyscaleGlobals, greyscaleUtilsSrv,
                                           greyscaleProfileSrv, greyscaleModalsSrv,
                                           greyscaleLanguageSrv, greyscaleUoaTagSrv,
                                           greyscaleUoaClassTypeSrv) {



        var dicts = {
            languages: [],
            uoaClassTypes: []
        };

        var resDescr = [
            {
                field: 'id',
                title: 'ID',
                show: true,
                sortable: 'id',
                dataFormat: 'text',
                dataRequired: true,
                dataReadOnly: 'both'
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
                dataFormat: 'text',
                dataRequired: true
            },
            {
                field: 'classTypeId',
                title: 'Classification Type',
                show: true,
                sortable: 'classTypeId',
                dataFormat: 'option',
                dataRequired: true,
                dataSet: {
                    getData: getClassTypes,
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
                        handler: _editUoaTag
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
            title: 'Tags',
            icon: 'fa-table',
            sorting: {id: 'asc'},
            cols: resDescr,
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _addUoaTag
            }
        };

        function _editUoaTag(_uoaTag) {
            var op = 'editing';
            return greyscaleUoaTagSrv.get(_uoaTag)
                .then(function (uoaTag) {
                    return greyscaleModalsSrv.editRec(uoaTag, _table)
                })
                .then(function(uoaTag){
                    return greyscaleUoaTagSrv.update(uoaTag);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }
        function _addUoaTag() {
            var op = 'adding';
            return greyscaleModalsSrv.editRec(null, _table)
                .then(function (uoaTag) {
                    return greyscaleUoaTagSrv.add(uoaTag);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _delRecord(item) {
            greyscaleUoaTagSrv.delete(item.id)
                .then(reloadTable)
                .catch(function (err) {
                    errHandler(err, 'deleting');
                });
        }

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoaTags: greyscaleUoaTagSrv.list(),
                    uoaClassTypes: greyscaleUoaClassTypeSrv.list(),
                    languages: greyscaleLanguageSrv.list()
                };
                return $q.all(req).then(function (promises) {
                    for (var p = 0; p < promises.uoaTags.length; p++) {
                        greyscaleUtilsSrv.prepareFields(promises.uoaTags, resDescr);
                    }
                    dicts.languages = promises.languages;
                    dicts.uoaClassTypes = promises.uoaClassTypes;

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

        function errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
