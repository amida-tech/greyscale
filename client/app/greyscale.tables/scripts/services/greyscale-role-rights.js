'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleRoleRights', function ($q,
        greyscaleRightApi,
        greyscaleRoleApi,
        greyscaleEntityTypeApi,
        greyscaleModalsSrv,
        greyscaleUtilsSrv) {

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
            title: 'Action',
            show: true,
            sortable: 'action'
        }, {
            field: 'description',
            title: 'Description',
            show: true,
            sortable: false
        }, {
            field: 'essenceId',
            title: 'Entity Type',
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
                title: 'Delete',
                class: 'danger',
                handler: _deleteRoleRight
            }]
        }];

        var _table = {
            dataFilter: {},
            formTitle: 'Role right',
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
                greyscaleRoleApi.delRight(role.id, roleRight.id)
                    .then(_reloadTable)
                    .catch(function (err) {
                        _errorHandler(err, 'deleting');
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
                        _errorHandler(err, 'adding');
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
                return $q.reject('no data');
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
            var msg = _table.formTitle;
            if (action) {
                msg += ' ' + action;
            }
            msg += ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
