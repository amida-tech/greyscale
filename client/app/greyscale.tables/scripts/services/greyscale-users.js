/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUsersTbl', function ($q, greyscaleModalsSrv, greyscaleUserApi, greyscaleRoleApi, greyscaleUtilsSrv,
        greyscaleProfileSrv, greyscaleGlobals, greyscaleOrganizationApi) {
        var accessLevel;

        var tns = 'USERS.';

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
            field: 'organizationId',
            show: _isSuperAdmin,
            sortable: 'organizationId',
            title: tns + 'ORGANIZATION',
            dataFormat: 'option',
            dataReadOnly: 'edit',
            dataHide: _isNotSuperAdmin,
            dataSet: {
                getData: getOrgs,
                keyField: 'id',
                valField: 'name'
            }
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
            field: 'last_active',
            title: 'Last Active',
            show: true,
            sortable: 'last_active',
            dataReadOnly: 'both',
            cellTemplate: '<span ng-hide="cell" translate="USERS.NOT_LOGGED"></span>{{cell|date:\'medium\'}}'
        }, {
            field: 'isActive',
            title: 'Is Active',
            show: true,
            sortable: 'isActive',
            dataFormat: 'boolean',
            dataReadOnly: 'both'
        }, {
            field: 'isAnonym',
            title: 'Anonymous',
            show: false,
            sortable: 'isAnonym',
            dataFormat: 'boolean'
        }, {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-pencil',
                class: 'primary',
                handler: _editRecord
            }, {
                icon: 'fa-trash',
                class: 'secondary',
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
                icon: 'fa-plus',
                handler: _editRecord
            }
        };

        function _getRoles() {
            return dicts.roles;
        }

        function getOrgs() {
            return dicts.orgs;
        }

        function _delRecord(rec) {
            greyscaleUserApi.delete(rec.id)
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
                        return greyscaleUserApi.update(newRec);
                    } else {
                        if (_isSuperAdmin()) {
                            return greyscaleUserApi.inviteAdmin(newRec);
                        } else if (_isAdmin()) {
                            return greyscaleUserApi.inviteUser(newRec);
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
            return ((accessLevel & greyscaleGlobals.userRoles.superAdmin.mask) !== 0);
        }

        function _isNotSuperAdmin() {
            return !_isSuperAdmin();
        }

        function _isAdmin() {
            return ((accessLevel & greyscaleGlobals.userRoles.admin.mask) !== 0);
        }

        function _getUsers() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {

                accessLevel = greyscaleProfileSrv.getAccessLevelMask();

                var roleFilter = {};

                if (_isAdmin()) {
                    _table.dataFilter.organizationId = profile.organizationId;
                } else {
                    delete _table.dataFilter.organizationId;
                    roleFilter = {
                        isSystem: true
                    };
                }

                var reqs = {
                    users: greyscaleUserApi.list(_table.dataFilter),
                    roles: greyscaleRoleApi.list(roleFilter),
                    orgs: greyscaleOrganizationApi.list({
                        organizationId: profile.organizationId
                    }),
                };

                return $q.all(reqs).then(function (promises) {
                    dicts.roles = _filterRolesByAccessLevel(promises.roles);
                    dicts.orgs = promises.orgs;
                    greyscaleUtilsSrv.prepareFields(promises.users, _fields);
                    return promises.users;
                });

            }).catch(errorHandler);
        }

        function _filterRolesByAccessLevel(roles) {
            var filteredRoles = [];
            if (_isAdmin()) {
                angular.forEach(roles, function (role, i) {
                    if (role.id !== greyscaleGlobals.userRoles.superAdmin.id) {
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
