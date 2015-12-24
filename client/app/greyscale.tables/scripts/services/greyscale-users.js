/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUsers', function (_, greyscaleModalsSrv, greyscaleUserSrv, greyscaleRoleSrv) {
        var _getRoles = function () {
            return greyscaleRoleSrv.list();
        };

        var _getUsers = function () {
            return _getRoles().then(function (roles) {
                return greyscaleUserSrv.list().then(function (users) {
                    for (var l = 0; l < users.length; l++) {
                        users[l].roleID = _.get(_.find(roles, {id: users[l].roleID}), 'name');
                    }
                    return users;
                });
            });
        };

        return {
            title: 'Users',
            icon: 'fa-users',
            cols: [
                {
                    field: 'id',
                    title: 'ID',
                    show: false,
                    sortable: 'id'
                },
                {
                    field: 'email',
                    title: 'E-mail',
                    show: true,
                    sortable: 'email'
                },
                {
                    field: 'firstName',
                    title: 'First name',
                    show: true,
                    sortable: 'firstName'
                },
                {
                    field: 'lastName',
                    title: 'Last name',
                    show: true,
                    sortable: 'lastName'
                },
                {
                    field: 'roleID',
                    title: 'Role',
                    show: true,
                    sortable: 'roleID'
                },
                {
                    field: 'created',
                    title: 'Created',
                    show: true,
                    sortable: 'created',
                    dataFormat: 'date'
                },
                {
                    field: 'isActive',
                    title: 'Is Active',
                    show: true,
                    sortable: 'isActive',
                    dataFormat: 'boolean'
                }
            ],
            dataPromise: _getUsers,
            pageLength: 5,
            add: {
                title: 'Invite',
                handler: greyscaleModalsSrv.inviteUser
            }
        };
    });
