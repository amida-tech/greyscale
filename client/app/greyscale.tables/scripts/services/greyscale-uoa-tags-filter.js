/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaTagsFilter', function ($q, greyscaleUtilsSrv, greyscaleProfileSrv, greyscaleModalsSrv,
        greyscaleLanguageApi, greyscaleUoaTagApi, greyscaleUoaClassTypeApi) {

        var dicts = {
            languages: [],
            uoaClassTypes: []
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
        }, {
            show: true,
            multiselect: true
        }];

        var _table = {
            dataFilter: {},
            title: 'Tags',
            icon: 'fa-table',
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            multiselect: {}
        };

        function _getSearchParam(name) {
            var ids = _table.dataFilter[name];
            return ids && ids.length ?  ids.join('|') : null;
        }

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {

                var req = {
                    uoaTags: _resolveSearchResult(),
                    uoaClassTypes: greyscaleUoaClassTypeApi.list(),
                    languages: greyscaleLanguageApi.list()
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

        function _resolveSearchResult() {
            var params;
            var typeIds = _getSearchParam('classTypeId');
            if (typeIds) {
                params = {
                    classTypeId: typeIds
                };
                return greyscaleUoaTagApi.list(params)
            } else {
                return $q.when([]);
            }
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
