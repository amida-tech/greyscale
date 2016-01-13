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

    var _dicts = {
        rights: null,
        entityTypes: null
    };

    var _fields = [
        {
            field: 'id',
            title: 'ID',
            show: false,
            sortable:'id'
        },
        {
            field: 'action',
            title: 'Action',
            show: true,
            sortable: 'action'
        },
        {
            field: 'description',
            title: 'Description',
            show: true,
            sortable: false
        },
        {
            field: 'essenceId',
            title: 'Entity Type ID',
            show: false,
            sortable: 'essenceId'
        },
        {
            field: 'entityType',
            title: 'Entity Type',
            show: true,
            sortable:'entityType'
        },
        {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [
                {
                    title: 'Delete',
                    class: 'danger',
                    handler: _deleteRoleRight
                }
            ]
        }
    ];

    var _table = {
        dataFilter: {},
        title: 'Role Rights',
        icon: 'fa-tasks',
        cols: _fields,
        dataPromise: _getData,
        add: {
            title: 'Add',
            handler: _addRoleRight
        }
    };

    function _deleteRoleRight(roleRight) {
        var role = _table.dataFilter.role;
        if (role) {
            greyscaleRoleSrv.delRight(role.id, roleRight.id)
            .then(_reloadTable)
            .catch(function (err) {
                inform.add('Role right delete error: ' + err);
            });
        }
    }

    function _addRoleRight() {
        var role = _table.dataFilter.role;
        if (role) {
            return greyscaleModalsSrv.addRoleRight({right: null}, {
                    rights: _getRights(),
                    role: role
                })
                .then(function (right) {
                    return greyscaleRoleSrv.addRight(role.id, right.id);
                })
                .then(_reloadTable)
                .catch(function (err) {
                    if (err && err.data) {
                        inform.add(err.data.message);
                    }
                });
        }
    }

    function _getRights() {
        return _dicts.rights;
    }

    function _getEntityTypes() {
        return _dicts.entityTypes;
    }

    function _reloadTable() {
        _table.tableParams.reload();
    }

    function _getData() {
        var role = _table.dataFilter.role;
        if (role) {
            return greyscaleRoleSrv.listRights(role.id)
            .then(_loadDicts)
            .then(_decodeEntityTypes);
        } else {
            return $q.reject('no data');
        }
    }

    function _loadDicts(roles) {
        var req = {};
        if (!_dicts.rights) {
            req.rights = greyscaleRightSrv.list();
            req.entityTypes = greyscaleEntityTypeSrv.list();
        }

        return $q.all(req).then(function (promises) {
            if (promises.rights) {
                _dicts.entityTypes = promises.entityTypes;
                _dicts.rights = _decodeEntityTypes(promises.rights);
            }
            return roles;
        });
    }

    function _decodeEntityTypes(data) {
        for (var q = 0; q < data.length; q++) {
            data[q].entityType = _.get(_.find(_getEntityTypes(), {id: data[q].essenceId}), 'name');
        }
        return data;
    }

    return _table;
});
