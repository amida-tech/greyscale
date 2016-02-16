/**
 * Created by igi on 28.12.15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleUoasImportTbl', function ($q, greyscaleUoaTypeApi) {

        var tns = 'IMPORT.UOAS.';

        var _dicts = {};

        var _fields = [{
            field: 'name',
            show: true,
            sortable: 'name',
            title: tns + 'NAME'
        }, {
            sortable: 'message',
            title: tns + 'STATUS',
            cellTemplate: '<span ng-class="{\'text-danger\':(row.parse_status == \'skipped\'), \'text-success\':(row.parse_status == \'Ok\')}">' +
                '{{row.message}}</span>'
        }];

        var _table = {
            title: tns + 'RESULTS_TITLE',
            icon: 'fa-upload',
            cols: _fields,
            pageLength: 10,
            dataPromise: _loadData
        };

        function _loadData() {
            var reqs = {
                importData: _table.importData || $q.when([]),
                uoaTypes: greyscaleUoaTypeApi.list()
            };
            return $q.all(reqs)
                .then(function (data) {
                    _dicts.uoaTypes = data.uoaTypes;
                });
        }

        return _table;
    });
