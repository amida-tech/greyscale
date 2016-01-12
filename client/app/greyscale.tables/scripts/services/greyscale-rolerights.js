'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleRoleRights', function (
        $q,
        greyscaleGlobals,
        greyscaleRightSrv,
        greyscaleRoleSrv,
        greyscaleEntityTypeSrv,
        greyscaleModalsSrv,
        inform
    ) {

        var _fields = angular.copy(greyscaleGlobals.tables.rights.cols);
        _fields.push({
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                title: 'Delete',
                class: 'danger',
                handler: function (roleRight) {
                    var role = _table.dataFilter.role;
                    if (role) {
                        greyscaleRoleSrv.delRight(role.id, roleRight.id)
                            .then(_reloadTable)
                            .catch(function (err) {
                                inform.add('Role right delete error: ' + err);
                            });
                    }
                }
            }]
        });

        var _table = {
            dataFilter: {},
            title: 'Role Rights',
            icon: 'fa-tasks',
            cols: _fields,
            dataPromise: _getRoleRights,
            add: {
                title: 'add',
                handler: function () {
                    var role = _table.dataFilter.role;
                    if (role) {
                        _getRights()
                            .then(function (rights) {
                                return greyscaleModalsSrv.addRoleRight({
                                        right: null
                                    }, {
                                        rights: rights,
                                        role: role
                                    })
                                    .then(function (right) {
                                        return greyscaleRoleSrv.addRight(role.id, right.id);
                                    })
                                    .then(_reloadTable);
                            })
                            .catch(function (err) {
                                if (err && err.data) {
                                    inform.add(err.data.message);
                                }
                            });

                    }
                }
            }
        };

        function _reloadTable() {
            _table.tableParams.reload();
        }

        function _getRights() {
            return greyscaleRightSrv.list().then(_decodeEntityTypes);
        }

        function _getRoleRights() {
            var role = _table.dataFilter.role;
            if (role) {
                return greyscaleRoleSrv.listRights(role.id)
                    .then(_decodeEntityTypes);
            } else {
                return $q.reject('no data');
            }
        }

        function _decodeEntityTypes(data) {
            return _getEntityTypes().then(function (entityTypes) {
                for (var q = 0; q < data.length; q++) {
                    data[q].entityType = _.get(_.find(entityTypes, {
                        id: data[q].essenceId
                    }), 'name');
                }
                return data;
            });
        }

        function _getEntityTypes() {
            return greyscaleEntityTypeSrv.list();
        }

        return _table;
    });
