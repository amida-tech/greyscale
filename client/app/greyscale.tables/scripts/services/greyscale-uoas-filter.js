'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoasFilterTbl', function ($q, greyscaleGlobals, greyscaleUtilsSrv,
        greyscaleProfileSrv, greyscaleModalsSrv,
        greyscaleLanguageApi, greyscaleUoaApi,
        greyscaleUoaTypeApi) {

        var tns = 'UOAS_FILTER.';

        var dicts = {
            languages: [],
            uoaTypes: [],
            visibility: greyscaleGlobals.uoaVisibility,
            status: greyscaleGlobals.uoaStatus
        };

        var resDescr = [{
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
                field: 'shortName',
                title: tns + 'SHORT_NAME',
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
                title: tns + 'TYPE',
                show: true,
                sortable: 'unitOfAnalysisType',
                dataFormat: 'option',
                dataRequired: true,
                dataSet: {
                    getData: getUoaTypes,
                    keyField: 'id',
                    valField: 'name'
                }
            },
            /*
             field: 'parentId',
             field: 'creatorId',
             field: 'ownerId',
             */
            {
                show: true,
                multiselect: true
            }
        ];

        var _table = {
            title: tns + 'TABLE_TITLE',
            icon: 'fa-table',
            sorting: {
                id: 'asc'
            },
            cols: resDescr,
            dataPromise: _getData,
            multiselect: {},
            showAllButton: true,
            dataFilter: {}
        };

        function _getSearchParam(name) {
            var ids = _table.dataFilter[name];
            return ids && ids.length ? ids.join('|') : null;
        }

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoas: _resolveSearchResult(),
                    uoaTypes: greyscaleUoaTypeApi.list(),
                    languages: greyscaleLanguageApi.list()
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

        function _resolveSearchResult() {
            var params;
            var typeIds = _getSearchParam('typeId');
            var tagsIds = _getSearchParam('tagId');
            if (typeIds && tagsIds) {
                params = {
                    unitOfAnalysisType: typeIds,
                    tagId: tagsIds
                };
                return greyscaleUoaApi.list(params);
            } else {
                return greyscaleUoaApi.list({
                    unitOfAnalysisType: 1 // countries
                });
                //return $q.when([]);
            }
        }

        function getUoaTypes() {
            return dicts.uoaTypes;
        }

        return _table;
    });
