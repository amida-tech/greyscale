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
            field: 'description',
            show: true,
            sortable: 'description',
            title: tns + 'DESCRIPTION'
        }, {
            field: 'shortName',
            show: true,
            sortable: 'shortName',
            title: tns + 'SHORT_NAME'
        }, {
            field: 'ISO',
            show: true,
            sortable: 'ISO',
            title: tns + 'ISO'
        }, {
            field: 'ISO2',
            show: true,
            sortable: 'ISO2',
            title: tns + 'ISO2'
        }, {
            field: 'nameISO',
            show: true,
            sortable: 'nameISO',
            title: tns + 'NAMEISO'
        }, {
            field: 'uoaType',
            show: true,
            sortable: 'uoaType',
            title: tns + 'UOA_TYPE'
        }, {
            field: 'visibility',
            show: true,
            sortable: 'visibility',
            title: tns + 'VISIBILITY'
        }, {
            field: 'status',
            show: true,
            sortable: 'status',
            title: tns + 'STATUS'
        }, {
            sortable: 'message',
            title: tns + 'STATUS',
            cellTemplate: '<div ng-class="{\'text-danger\':(row.parse_status == \'skipped\'), \'text-success\':(row.parse_status == \'Ok\')}">' +
                '{{row.message}}<div ng-repeat="message in row.messages">{{message}}</div></div>'
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
