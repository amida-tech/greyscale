/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('AccessCtrl', function ($scope, NgTableParams, $filter, inform, greyscaleProfileSrv, greyscaleRoleSrv,
                                        greyscaleUserSrv, greyscaleGlobals, greyscaleModalsSrv, greyscaleRightSrv, _) {
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
                    if ($scope.model.roles.current) {
                        _getRoleRigths($scope.model.roles.current.id).then(function (roleRights) {
                            _proceedData(roleRights, $defer, params);
                        });
                    }
                }
            });

        var _roleRights = angular.copy(greyscaleGlobals.tables.roleRights.cols);
        _roleRights.push({
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [
                {
                    title: 'Delete',
                    class: 'danger',
                    handler: function (roleRight) {
                        greyscaleRoleSrv.delRight($scope.model.roles.current.id, roleRight.id)
                            .then(function () {
                                _roleRightsTableParams.reload();
                            })
                            .catch(function (err) {
                                inform.add('Role right delete error: ' + err);
                            });
                    }
                }
            ]
        });

        var _getRights = function () {
            return greyscaleRightSrv.list();
        };

        var _edtRight = function (_right) {
            greyscaleModalsSrv.editRight(_right) //
                .then(function (_right) {
                    if (_right.id) {
                        return greyscaleRightSrv.update(_right);
                    } else {
                        return greyscaleRightSrv.add(_right);
                    }
                })
                .then(_reloadRights)
                .catch(function (err) {
                    if (err) {
                        inform.add('Role right update error: ' + err);
                    }
                });
        };

        var _reloadRights = function () {
            $scope.model.rights.tableParams.reload();
        };

        var _rights = angular.copy(greyscaleGlobals.tables.roleRights.cols);
        _rights.push({
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [
                {
                    title: 'Edit',
                    class: 'info',
                    handler: _edtRight
                },
                {
                    title: 'Delete',
                    class: 'danger',
                    handler: function (right) {
                        greyscaleRightSrv.delete(right.id)
                            .then(_reloadRights)
                            .catch(function (err) {
                                inform.add('Right right delete error: ' + err);
                            });
                    }
                }
            ]
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
                title: 'Role Rights',
                icon: 'fa-tasks',
                cols: _roleRights,
                dataPromise: _getRoleRigths,
                tableParams: _roleRightsTableParams,
                add: {
                    title: 'add',
                    handler: function () {
                        if ($scope.model.roles.current) {
                            greyscaleModalsSrv.addRoleRight($scope.model.roles.current)
                                .then(function (rightId) {
                                    return greyscaleRoleSrv.addRight($scope.model.roles.current.id, rightId);
                                })
                                .then(function() {
                                    _roleRightsTableParams.reload();
                                })
                                .catch(function (err) {
                                    if (err && err.data) {
                                        inform.add(err.data.message);
                                    }
                                });
                        }
                    }
                }
            },
            rights: {
                title: 'Rights',
                icon: 'fa-tasks',
                cols: _rights,
                dataPromise: _getRights,
                add: {
                    title: 'add',
                    handler: _edtRight
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
