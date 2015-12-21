/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('AccessCtrl', function ($scope, _, $log, $q, inform, greyscaleRoleSrv, greyscaleGlobals,
                                        greyscaleModalsSrv, greyscaleRightSrv, greyscaleEntryTypeSrv) {

        var _getEntryTypes = function () {
            return greyscaleEntryTypeSrv.list();
        };

        var _decodeEntryTypes = function (data) {
            return _getEntryTypes().then(function (entryTypes) {
                for (var q = 0; q < data.length; q++) {
                    data[q].entryType = _.get(_.find(entryTypes, {id: data[q].essenceId}), 'name');
                }
                return data;
            });
        };

        var _getRoleRigths = function () {
            if ($scope.model.roles.current) {
                return greyscaleRoleSrv.listRights($scope.model.roles.current.id)
                    .then(_decodeEntryTypes);
            } else {
                return $q.reject('no data');
            }
        };

        var _getRoles = function () {
            return greyscaleRoleSrv.list();
        };

        var _reloadRoleRights = function () {
            $scope.model.roleRights.tableParams.reload();
        };

        var _roleRights = angular.copy(greyscaleGlobals.tables.rights.cols);

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
                            .then(_reloadRoleRights)
                            .catch(function (err) {
                                inform.add('Role right delete error: ' + err);
                            });
                    }
                }
            ]
        });

        var _getRights = function () {
            return greyscaleRightSrv.list().then(_decodeEntryTypes);
        };

        var _edtRight = function (_right) {
            _getEntryTypes().then(function (entryTypes) {
                return greyscaleModalsSrv.editRight(_right, {entryTypes: entryTypes})
                    .then(function (_right) {
                        if (_right.id) {
                            return greyscaleRightSrv.update(_right);
                        } else {
                            return greyscaleRightSrv.add(_right);
                        }
                    })
                    .then(_reloadRights)
            })
                .catch(function (err) {
                    $log.debug(err);
                    if (err) {
                        inform.add('Role right update error: ' + err);
                    }
                });
        };

        var _reloadRights = function () {
            $scope.model.rights.tableParams.reload();
        };

        var _rights = angular.copy(greyscaleGlobals.tables.rights.cols);
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
            roleRights: {
                title: 'Role Rights',
                icon: 'fa-tasks',
                cols: _roleRights,
                dataPromise: _getRoleRigths,
                add: {
                    title: 'add',
                    handler: function () {
                        if ($scope.model.roles.current) {
                            _getRights()
                                .then(function (rights) {
                                    return greyscaleModalsSrv.addRoleRight({right: null}, {
                                        rights: rights,
                                        role: $scope.model.roles.current
                                    })
                                        .then(function (right) {
                                            return greyscaleRoleSrv.addRight($scope.model.roles.current.id, right.id);
                                        })
                                        .then(_reloadRoleRights)
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
                _reloadRoleRights();
            }
            return $scope.model.roles.current;
        };
    });
