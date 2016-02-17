/**
 * Created by igi on 28.12.15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleUsersImportTbl', function () {

        var tns = 'IMPORT.USERS.';

        var _fields = [{
            field: 'email',
            show: true,
            sortable: 'email',
            title: tns + 'EMAIL'
        }, {
            field: 'firstName',
            sortable: 'firstName',
            show: true,
            title: tns + 'FIRST_NAME'
        }, {
            field: 'lastName',
            show: true,
            sortable: 'lastName',
            title: tns + 'LAST_NAME'
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
            pageLength: 10
        };

        return _table;
    });
