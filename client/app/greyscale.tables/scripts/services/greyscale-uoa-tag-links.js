/**
 * Created by DTseytlin on 29.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaTagLinksTbl', function (_, $q, greyscaleUtilsSrv, greyscaleProfileSrv, greyscaleModalsSrv,
        greyscaleUoaApi, greyscaleUoaTagApi, greyscaleUoaClassTypeApi, greyscaleUoaTagLinkApi) {

        var tns = 'UOAS.';

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
            title: tns + 'UOA',
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
            title: tns + 'TAG',
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
                tooltip: 'COMMON.DELETE',
                handler: _delRecord
            }]
        }];

        var _table = {
            title: tns + 'UOA_TAG_LINKS',
            formTitle: tns + 'UOA_TAG_LINK',
            icon: 'fa-table',
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            add: {
                handler: _addUoaTagLink
            },
            query: {},
            update: {
                uoaTags: _updateUoaTags,
                uoas: _updateUoas
            },
        };

        function _updateUoaTags(uoaTags) {
            if (uoaTags) {
                dicts.uoaTags = uoaTags;
            }
        }

        function _updateUoas(uoas) {
            if (uoas) {
                dicts.uoas = uoas;
            }
        }

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

        function _delRecord(uoaTagLink) {
            var uoa = _.find(dicts.uoas, {
                id: uoaTagLink.uoaId
            });
            var tag = _.find(dicts.uoaTags, {
                id: uoaTagLink.uoaTagId
            });
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM_UOA_TAG_LINK',
                uoa: uoa,
                tag: tag,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleUoaTagLinkApi.delete(uoaTagLink.id)
                    .then(reloadTable)
                    .catch(function (err) {
                        errHandler(err, 'deleting');
                    });
            });
        }

        function _getData() {
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
