/**
 * Created by igi on 12/23/15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleRoles', function (greyscaleRoleSrv) {
        var _getRoles = function () {
            return greyscaleRoleSrv.list();
        };

        return {
            title: 'Roles',
            icon: 'fa-users',
            cols: [{
                field: 'id',
                title: 'ID',
                show: true,
                sortable: 'id'
            }, {
                field: 'name',
                title: 'Name',
                show: true,
                sortable: 'name'
            }, {
                field: 'isSystem',
                title: 'System Role',
                show: true,
                sortable: 'isSystem',
                dataFormat: 'boolean'
            }],
            sorting: {
                'id': 'asc'
            },
            dataPromise: _getRoles
        };
    });
