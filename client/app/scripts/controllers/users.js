/**
 * Created by igi on 21.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('UsersCtrl', function ($scope, _, greyscaleGlobals, greyscaleModalsSrv, greyscaleUserSrv, greyscaleRoleSrv) {
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
        $scope.model = {
            users: {
                editable: true,
                title: 'Users',
                icon: 'fa-users',
                cols: greyscaleGlobals.tables.users.cols,
                dataPromise: _getUsers,
                pageLength: 5,
                add: {
                    title: 'Invite',
                    handler: greyscaleModalsSrv.inviteUser
                }

            }
        };
    });
