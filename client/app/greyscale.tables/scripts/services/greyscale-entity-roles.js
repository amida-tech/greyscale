/**
 * Created by igi on 28.12.15.
 */
"use strict";
angular.module('greyscale.tables')
    .factory('greyscaleEntityRoles', function ($q, greyscaleUtilsSrv, greyscaleProfileSrv, greyscaleModalsSrv,
                                               greyscaleEntityTypeRoleSrv, greyscaleUserSrv, greyscaleRoleSrv,
                                               greyscaleEntityTypeSrv) {
        var _dicts = {
            users: [],
            roles: [],
            entTypes: []
        };

        var _tableRestSrv = greyscaleEntityTypeRoleSrv;

        var _fields = [
            {
                field: 'roleId',
                show: true,
                title: 'Role',
                dataFormat: 'option',
                dataSet: {
                    keyField: 'id',
                    valField: 'name',
                    getData: getRoles
                }
            },
            {
                field: 'userId',
                show: true,
                title: 'User',
                dataFormat: 'option',
                dataSet: {
                    keyField: 'id',
                    valField: 'email',
                    getData: getUsers
                }
            },
            {
                field: 'essenceId',
                show: true,
                title: 'Entity Type',
                dataFormat: 'option',
                dataSet: {
                    keyField: 'id',
                    valField: 'name',
                    getData: getEntityTypes
                }
            },
            {
                field: 'entityId',
                show: true,
                title: 'Entity Title'
            },
            {
                field: '',
                title: '',
                show: true,
                dataFormat: 'action',
                actions: [
                    {
                        icon: 'fa-pencil',
                        class: 'info',
                        handler: _editRecord
                    },
                    {
                        icon: 'fa-trash',
                        class: 'danger',
                        handler: _delRecord
                    }
                ]
            }
        ];

        var _table = {
            formTitle: 'entity role',
            title: 'Entity roles',
            icon: 'fa-university',
            cols: _fields,
            dataPromise: getData,
            pageLength: 10,
            add: {
                title: 'Add',
                handler: _editRecord
            }

        };

        function getUsers() {
            return _dicts.users;
        }

        function getRoles() {
            return _dicts.roles;
        }

        function getEntityTypes() {
            return _dicts.entTypes;
        }

        function _delRecord(rec) {
            _tableRestSrv.delete(rec.id)
                .then(reloadTable)
                .catch(function (err) {
                    errorHandler(err, 'deleting');
                });
        }

        function _editRecord(user) {
            var action = (typeof user === 'undefined') ? 'adding' : 'editing';
            return greyscaleModalsSrv.editRec(user, _table)
                .then(function (newRec) {
                    if (action === 'editing') {
                        return _tableRestSrv.update(newRec);
                    } else {
                        return _tableRestSrv.add(newRec);
                    }
                })
                .then(reloadTable)
                .catch(function (err) {
                    errorHandler(err, action);
                });
        }

        function getData() {
            return greyscaleProfileSrv.getProfile()
                .then(function (profile) {
                    var reqs = {
                        data: _tableRestSrv.list(),
                        users: greyscaleUserSrv.list({organizationId: profile.organizationId}),
                        roles: greyscaleRoleSrv.list(),
                        entTypes: greyscaleEntityTypeSrv.list()
                    };

                    return $q.all(reqs).then(function (promises) {
                        _dicts.users = promises.users;
                        _dicts.roles = promises.roles;
                        _dicts.entTypes = promises.entTypes;

                        greyscaleUtilsSrv.prepareFields(promises.data, _fields);
                        return promises.data;
                    });
                })
                .catch(errorHandler);
        }

        function reloadTable() {
            _table.tableParams.reload();
        }

        function errorHandler(err, action) {
            var msg = _table.formTitle;
            if (action) {
                msg += ' ' + action;
            }
            msg += ' error';
            greyscaleUtilsSrv.errorMsg(err, msg)
        }

        return _table;
    });
