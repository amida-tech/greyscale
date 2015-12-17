/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('AccessCtrl', function ($scope, NgTableParams, $filter, greyscaleProfileSrv, greyscaleRoleSrv,
                                        greyscaleUserSrv, greyscaleGlobals, greyscaleModalsSrv, _, $log) {
        var _getRoleRigths = function () {
            return greyscaleRoleSrv.listRights($scope.model.roles.current.id);
        };

        var _getRoles = function () {
            return greyscaleProfileSrv.getProfile().then(greyscaleRoleSrv.list);
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

        var _proceedData = function (data, $defer, params) {
            params.total(data.length);
            var orderedData = params.sorting() ?
                $filter('orderBy')(data, params.orderBy()) : data;
            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        };

        var _roleRightsTableParams = new NgTableParams(
            {
                page: 1,
                count: 5,
                sorting: {id: 'asc'}
            },
            {
                counts: [],
                getData: function ($defer, params) {
                    $log.debug($scope.model.roles.current);
                    if ($scope.model.roles.current) {
                        _getRoleRigths($scope.model.roles.current.id).then(function (roleRights) {
                            _proceedData(roleRights, $defer, params);
                        });
                    }
                }
            });

        $scope.model = {
            roles: {
                editable: false,
                title: 'Roles',
                icon: 'fa-users',
                cols: greyscaleGlobals.tables.roles.cols,
                sorting: {'id': 'asc'},
                dataPromise: _getRoles
            },
            users: {
                editable: true,
                title: 'Users',
                icon: 'fa-users',
                cols: greyscaleGlobals.tables.users.cols,
                dataPromise: _getUsers,
                add: {
                    title: 'Invite',
                    handler: greyscaleModalsSrv.inviteUser
                }

            },
            roleRights: {
                title: 'role rights',
                icon: 'fa-icon',
                cols: greyscaleGlobals.tables.roleRights.cols,
                dataPromise: _getRoleRigths,
                tableParams: _roleRightsTableParams,
                add: {
                    title: 'add',
                    handler: function () {
                        if ($scope.model.roles.current) {
                            greyscaleModalsSrv.addRoleRight($scope.model.roles.current).then(function (res) {
                                if (res) {
                                    _roleRightsTableParams.reload();
                                }
                            });
                        }
                    }
                }
            }
        };

        $scope.selectRole = function (role) {
            if (typeof role !== 'undefined') {
                _roleRightsTableParams.reload();
            }
            return $scope.model.roles.current;
        };
    });
