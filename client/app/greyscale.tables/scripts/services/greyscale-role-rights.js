'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleRoleRightsTbl', function ($q,
        greyscaleRightApi,
        greyscaleRoleApi,
        greyscaleEntityTypeApi,
        greyscaleModalsSrv,
        greyscaleUtilsSrv) {

        var tns = 'ROLE_RIGHTS.';

        var _dicts = {
            rights: null,
            entityTypes: null
        };

        var _fields = [{
            field: 'id',
            title: 'ID',
            show: false,
            sortable: 'id'
        }, {
            field: 'action',
            title: tns + 'ACTION',
            show: true,
            sortable: 'action'
        }, {
            field: 'description',
            title: tns + 'DESCRIPTION',
            show: true,
            sortable: false
        }, {
            field: 'essenceId',
            title: tns + 'ENTITY_TYPE',
            show: true,
            sortable: 'essenceId',
            dataFormat: 'option',
            dataSet: {
                getData: _getEntityTypes,
                keyField: 'id',
                valField: 'name'
            }
        }, {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-trash',
                tooltip: 'COMMON.DELETE',
                handler: _deleteRoleRight
            }]
        }];

        var _table = {
            dataFilter: {},
            formTitle: tns + 'ROLE_RIGHT',
            title: tns + 'ROLE_RIGHTS',
            icon: 'fa-tasks',
            cols: _fields,
            dataPromise: _getData,
            add: {
                handler: _addRoleRight
            }
        };

        function _deleteRoleRight(roleRight) {
            var role = _table.dataFilter.role;
            if (role) {
                greyscaleModalsSrv.confirm({
                    message: tns + 'DELETE_CONFIRM',
                    role: role,
                    roleRight: roleRight,
                    okType: 'danger',
                    okText: 'COMMON.DELETE'
                }).then(function () {
                    greyscaleRoleApi.delRight(role.id, roleRight.id)
                        .then(_reloadTable)
                        .catch(function (err) {
                            _errorHandler(err, 'DELETE');
                        });
                });
            }
        }

        function _addRoleRight() {
            var role = _table.dataFilter.role;
            if (role) {
                return greyscaleModalsSrv.addRoleRight({
                        right: null
                    }, {
                        rights: _getRights(),
                        role: role
                    })
                    .then(function (right) {
                        return greyscaleRoleApi.addRight(role.id, right.id);
                    })
                    .then(_reloadTable)
                    .catch(function (err) {
                        _errorHandler(err, 'ADD');
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
                return greyscaleRoleApi.listRights(role.id)
                    .then(_loadDicts);
            } else {
                return $q.when([]);
            }
        }

        function _loadDicts(roles) {
            var req = {};
            if (!_dicts.rights) {
                req.rights = greyscaleRightApi.list();
                req.entityTypes = greyscaleEntityTypeApi.list({
                    fields: 'id,name'
                });
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
            var _dic = _getEntityTypes();
            for (var q = 0; q < data.length; q++) {
                data[q].entityType = greyscaleUtilsSrv.decode(_dic, 'id', data[q].essenceId, 'name');
            }
            return data;
        }

        function _errorHandler(err, action) {
            greyscaleUtilsSrv.apiErrorMessage(err, action, _table.formTitle);
        }

        return _table;
    });
