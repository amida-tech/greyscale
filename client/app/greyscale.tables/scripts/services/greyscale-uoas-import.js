/**
 * Created by igi on 28.12.15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleUoasImportTbl', function ($q, greyscaleUoaTypeApi, greyscaleGlobals) {

        var tns = 'IMPORT.UOAS.';

        var _dicts = {
            visibility: greyscaleGlobals.uoaVisibility,
            status: greyscaleGlobals.uoaStatus
        };

        greyscaleUoaTypeApi.list().then(function (data) {
            _dicts.uoaTypes = data;
        });

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
            field: 'unitOfAnalysisType',
            show: true,
            sortable: 'unitOfAnalysisType',
            title: tns + 'UOA_TYPE',
            dataFormat: 'option',
            dataSet: {
                getData: getUoaTypes,
                keyField: 'id',
                valField: 'name'
            }
        }, {
            field: 'visibility',
            show: true,
            sortable: 'visibility',
            title: tns + 'VISIBILITY',
            dataFormat: 'option',
            dataSet: {
                getData: getVisibilities,
                keyField: 'id',
                valField: 'name'
            }
        }, {
            field: 'status',
            show: true,
            sortable: 'status',
            title: tns + 'STATUS',
            dataFormat: 'option',
            dataSet: {
                getData: getStatuses,
                keyField: 'id',
                valField: 'name'
            }
        }, {
            sortable: 'message',
            title: tns + 'RESULT',
            cellTemplate: '<div ng-class="{\'text-danger\':(row.parse_status == \'skipped\'), \'text-success\':(row.parse_status == \'Ok\')}">' +
                '{{row.message}}<div ng-repeat="message in row.messages">{{message}}</div></div>'
        }];

        var _table = {
            title: tns + 'RESULTS_TITLE',
            icon: 'fa-upload',
            cols: _fields
        };

        function getStatuses() {
            return _dicts.status;
        }

        function getVisibilities() {
            return _dicts.visibility;
        }

        function getUoaTypes() {
            return _dicts.uoaTypes;
        }

        return _table;
    });
