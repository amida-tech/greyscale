/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUsers', function ($q, greyscaleModalsSrv, greyscaleUserSrv, greyscaleRoleSrv, greyscaleUtilsSrv,
        greyscaleProfileSrv, greyscaleGlobals) {
        var accessLevel;

        var dicts = {
            roles: []
        };

        var _fields = [{
            field: 'id',
            title: 'ID',
            show: false,
            sortable: 'id',
            dataReadOnly: 'both'
        }, {
            field: 'email',
            title: 'E-mail',
            show: true,
            sortable: 'email',
            dataRequired: true
        }, {
            field: 'firstName',
            title: 'First name',
            show: true,
            sortable: 'firstName',
            dataRequired: true
        }, {
            field: 'lastName',
            title: 'Last name',
            show: true,
            sortable: 'lastName'
        }, {
            field: 'roleID',
            title: 'Role',
            show: true,
            sortable: 'roleID',
            dataFormat: 'option',
            dataSet: {
                getData: _getRoles,
                keyField: 'id',
                valField: 'name'
            },
            dataReadOnly: 'add'

        }, {
            field: 'created',
            title: 'Created',
            show: true,
            sortable: 'created',
            dataFormat: 'date',
            dataReadOnly: 'both'
        }, {
            field: 'isActive',
            title: 'Is Active',
            show: true,
            sortable: 'isActive',
            dataFormat: 'boolean',
            dataReadOnly: 'both'
        }, {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-pencil',
                class: 'info',
                handler: _editRecord
            }, {
                icon: 'fa-trash',
                class: 'danger',
                handler: _delRecord
            }]
        }];

        var _table = {
            dataFilter: {},
            formTitle: 'user',
            title: 'Users',
            icon: 'fa-users',
            cols: _fields,
            dataPromise: _getUsers,
            pageLength: 10,
            add: {
                title: 'Invite',
                handler: _editRecord
            }
        };

        function _getRoles() {
            return dicts.roles;
        }

        function _delRecord(rec) {
            greyscaleUserSrv.delete(rec.id)
                .then(reloadTable)
                .catch(function (err) {
                    errorHandler(err, 'deleting');
                });
        }

        function _editRecord(user) {
            var action = 'adding';
            return greyscaleModalsSrv.editRec(user, _table)
                .then(function (newRec) {
                    if (newRec.id) {
                        action = 'editing';
                        return greyscaleUserSrv.update(newRec);
                    } else {
                        if (_isSuperAdmin()) {
                            return greyscaleUserSrv.inviteAdmin(newRec);
                        } else if (_isAdmin()) {
                            return greyscaleUserSrv.inviteUser(newRec);
                        }
                    }
                })
                .then(reloadTable)
                .catch(function (err) {
                    errorHandler(err, action);
                });
        }

        function reloadTable() {
            _table.tableParams.reload();
        }

        function _isSuperAdmin() {
            return accessLevel === greyscaleGlobals.systemRoles.superAdmin.mask;
        }

        function _isAdmin() {
            return accessLevel === greyscaleGlobals.systemRoles.admin.mask;
        }

        function _setAccessLevel() {
            accessLevel = greyscaleProfileSrv.getAccessLevelMask();
        }

        function _getUsers() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {

                _setAccessLevel(profile);

                if (_isAdmin()) {
                    _table.dataFilter.organizationId = profile.organizationId;
                } else {
                    delete _table.dataFilter.organizationId;
                }

                var reqs = {
                    users: greyscaleUserSrv.list(_table.dataFilter),
                    roles: greyscaleRoleSrv.list({
                        isSystem: true
                    })
                };

                return $q.all(reqs).then(function (promises) {
                    dicts.roles = _filterRolesByAccessLevel(promises.roles);
                    greyscaleUtilsSrv.prepareFields(promises.users, _fields);
                    return promises.users;
                });

            }).catch(errorHandler);
        }

        function _filterRolesByAccessLevel(roles) {
            var filteredRoles = [];
            if (_isAdmin()) {
                angular.forEach(roles, function (role, i) {
                    if (role.id !== greyscaleGlobals.systemRoles.superAdmin.id) {
                        filteredRoles.push(role);
                    }
                });
            } else {
                filteredRoles = roles;
            }
            return filteredRoles;
        }

        function errorHandler(err, action) {
            var msg = _table.formTitle;
            if (action) {
                msg += ' ' + action;
            }
            msg += ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
