/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('AccessCtrl', function ($scope, _, $log, $q, inform, greyscaleRoleSrv, greyscaleGlobals,
        greyscaleModalsSrv, greyscaleRightSrv, greyscaleEntityTypeSrv,
        greyscaleRoles, greyscaleRights) {

        var _getEntityTypes = function () {
            return greyscaleEntityTypeSrv.list();
        };

        var _decodeEntityTypes = function (data) {
            return _getEntityTypes().then(function (entityTypes) {
                for (var q = 0; q < data.length; q++) {
                    data[q].entityType = _.get(_.find(entityTypes, {
                        id: data[q].essenceId
                    }), 'name');
                }
                return data;
            });
        };

        var _getRoleRigths = function () {
            if ($scope.model.roles.current) {
                return greyscaleRoleSrv.listRights($scope.model.roles.current.id)
                    .then(_decodeEntityTypes);
            } else {
                return $q.reject('no data');
            }
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
            actions: [{
                title: 'Delete',
                class: 'danger',
                handler: function (roleRight) {
                    greyscaleRoleSrv.delRight($scope.model.roles.current.id, roleRight.id)
                        .then(_reloadRoleRights)
                        .catch(function (err) {
                            inform.add('Role right delete error: ' + err);
                        });
                }
            }]
        });

        var _getRights = function () {
            return greyscaleRightSrv.list().then(_decodeEntityTypes);
        };

        $scope.model = {
            roles: greyscaleRoles,
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
                                    return greyscaleModalsSrv.addRoleRight({
                                            right: null
                                        }, {
                                            rights: rights,
                                            role: $scope.model.roles.current
                                        })
                                        .then(function (right) {
                                            return greyscaleRoleSrv.addRight($scope.model.roles.current.id, right.id);
                                        })
                                        .then(_reloadRoleRights);
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
            rights: greyscaleRights
        };

        $scope.selectRole = function (role) {
            if (typeof role !== 'undefined') {
                _reloadRoleRights();
            }
            return $scope.model.roles.current;
        };
    });
