'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUoaClassTypesFilter', function ($q, greyscaleUtilsSrv, greyscaleProfileSrv, greyscaleModalsSrv,
        greyscaleLanguageSrv, greyscaleUoaClassTypeSrv) {

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
            dataFormat: 'text'
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
            selectable: true
        }];

        var _table = {
            title: 'Tag Classification Types',
            icon: 'fa-table',
            sorting: {
                id: 'asc'
            },
            pageLength: 5,
            cols: recDescr,
            dataPromise: _getData,
            selectable: {}
        };

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {
                var req = {
                    uoaClassTypes: greyscaleUoaClassTypeSrv.list(),
                    languages: greyscaleLanguageSrv.list()
                };
                return $q.all(req).then(function (promises) {
                    for (var p = 0; p < promises.uoaClassTypes.length; p++) {
                        greyscaleUtilsSrv.prepareFields(promises.uoaClassTypes, recDescr);
                    }
                    dicts.languages = promises.languages;

                    return promises.uoaClassTypes;
                });
            });
        }

        function getLanguages() {
            return dicts.languages;
        }

        return _table;
    });
