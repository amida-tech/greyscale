/**
 * Created by DTseytlin on 29.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaTagLinks', function ($q, greyscaleGlobals, greyscaleUtilsSrv,
                                           greyscaleProfileSrv, greyscaleModalsSrv,
                                           greyscaleUoaSrv, greyscaleUoaTagSrv,
                                           greyscaleUoaClassTypeSrv, greyscaleUoaTagLinkSrv,
                                           $log) {



        var dicts = {
            uoas: [],
            uoaTags: [],
            uoaClassType: []
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
                field: 'uoaId',
                title: 'Unit ID',
                show: true,
                sortable: 'uoaId',
                dataFormat: 'text',
                dataRequired: true
            },
            {
                field: 'uoaTagId',
                title: 'Tag ID',
                show: true,
                sortable: 'uoaTagId',
                dataFormat: 'text',
                dataRequired: true
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
                        handler: _editUoaTagLink
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
            title: 'Unit of Analysis to Tag link',
            icon: 'fa-table',
            sorting: {id: 'asc'},
            cols: resDescr,
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _addUoaTagLink
            }
        };

        function _editUoaTagLink(_uoaTagLink) {
            var op = 'editing';
            return greyscaleModalsSrv.editRec(_uoaTagLink, _table)
                .then(function(uoaTagLink){
                    return greyscaleUoaTagLinkSrv.update(uoaTagLink);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }
        function _addUoaTagLink() {
            var op = 'adding';
            return greyscaleModalsSrv.editRec(null, _table)
                .then(function (uoaTagLink) {
                    return greyscaleUoaTagLinkSrv.add(uoaTagLink);
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function _delRecord(item) {
            greyscaleUoaTagLinkSrv.delete(item.id)
                .then(reloadTable)
                .catch(function (err) {
                    errHandler(err, 'deleting');
                });
        }

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoaTagLinks: greyscaleUoaTagLinkSrv.list(),
                    uoas: greyscaleUoaSrv.list(),
                    uoaTags: greyscaleUoaTagSrv.list(),
                    uoaClassTypes: greyscaleUoaClassTypeSrv.list()
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
