/**
 * Created by DTseytlin on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaTypesFilterTbl', function ($q, greyscaleUtilsSrv, greyscaleProfileSrv, greyscaleModalsSrv,
        greyscaleUoaTypeApi, greyscaleLanguageApi) {

        var dicts = {
            languages: []
        };

        var recDescr = [{
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
            show: true,
            multiselect: true
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
            multiselect: {}
        };

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoaTypes: greyscaleUoaTypeApi.list(),
                    languages: greyscaleLanguageApi.list()
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
