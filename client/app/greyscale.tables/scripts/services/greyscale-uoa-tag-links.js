/**
 * Created by DTseytlin on 29.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaTagLinks', function ($q, greyscaleUtilsSrv, greyscaleProfileSrv, greyscaleModalsSrv,
        greyscaleUoaApi, greyscaleUoaTagApi, greyscaleUoaClassTypeApi,
        greyscaleUoaTagLinkApi, $log) {

        var dicts = {
            uoas: [],
            uoaTags: [],
            uoaClassType: []
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
            field: 'uoaId',
            title: 'Unit',
            show: true,
            sortable: 'uoaId',
            dataFormat: 'option',
            dataRequired: true,
            dataSet: {
                getData: getUoas,
                keyField: 'id',
                valField: 'name'
            }
        }, {
            field: 'uoaTagId',
            title: 'Tag',
            show: true,
            sortable: 'uoaTagId',
            dataFormat: 'option',
            dataRequired: true,
            dataSet: {
                getData: getUoaTags,
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
        }];

        var _table = {
            title: 'Unit to Tag link',
            icon: 'fa-table',
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _addUoaTagLink
            },
            query: {}
        };

        function _addUoaTagLink() {
            var op = 'adding';
            return greyscaleModalsSrv.editRec(null, _table)
                .then(function (uoaTagLink) {
                    return greyscaleUoaTagLinkApi.add(uoaTagLink);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _delRecord(item) {
            greyscaleUoaTagLinkApi.delete(item.id)
                .then(reloadTable)
                .catch(function (err) {
                    errHandler(err, 'deleting');
                });
        }

        function _getData() {
            $log.debug('UoaTagLink query: ', _table.query);
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoaTagLinks: greyscaleUoaTagLinkApi.list(_table.query),
                    uoas: greyscaleUoaApi.list(),
                    uoaTags: greyscaleUoaTagApi.list(),
                    uoaClassTypes: greyscaleUoaClassTypeApi.list()
                };
                return $q.all(req).then(function (promises) {
                    for (var p = 0; p < promises.uoaTagLinks.length; p++) {
                        greyscaleUtilsSrv.prepareFields(promises.uoaTagLinks, resDescr);
                    }
                    dicts.uoas = promises.uoas;
                    dicts.uoaTags = promises.uoaTags;
                    dicts.uoaClassTypes = promises.uoaClassTypes;

                    return promises.uoaTagLinks;
                });
            });
        }

        function getClassTypes() {
            return dicts.uoaClassTypes;
        }

        function getUoas() {
            return dicts.uoas;
        }

        function getUoaTags() {
            return dicts.uoaTags;
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
