/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUsers', function ($q, greyscaleModalsSrv, greyscaleUserSrv, greyscaleRoleSrv, greyscaleUtilsSrv, $log) {
        var dicts = {
            roles: []
        };

        var _fields = [
            {
                field: 'id',
                title: 'ID',
                show: false,
                sortable: 'id',
                dataReadOnly: 'both'
            },
            {
                field: 'email',
                title: 'E-mail',
                show: true,
                sortable: 'email'
            },
            {
                field: 'firstName',
                title: 'First name',
                show: true,
                sortable: 'firstName'
            },
            {
                field: 'lastName',
                title: 'Last name',
                show: true,
                sortable: 'lastName'
            },
            {
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

            },
            {
                field: 'created',
                title: 'Created',
                show: true,
                sortable: 'created',
                dataFormat: 'date',
                dataReadOnly: 'both'
            },
            {
                field: 'isActive',
                title: 'Is Active',
                show: true,
                sortable: 'isActive',
                dataFormat: 'boolean',
                dataReadOnly: 'both'
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
            $log.debug(rec);
            greyscaleUserSrv.delete(rec.id)
                .then(reloadTable)
                .catch(function(err){
                    errorHandler(err,'deleting');
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
                        return greyscaleUserSrv.invite(newRec);
                    }
                })
                .then(reloadTable)
                .catch(function(err){
                    errorHandler(err,action);
                });
        }

        function reloadTable() {
            _table.tableParams.reload();
        }

        function _getUsers() {
            var reqs = {
                users: greyscaleUserSrv.list(),
                roles: greyscaleRoleSrv.list()
            };

            return $q.all(reqs).then(function (promises) {
                dicts.roles = promises.roles;
                greyscaleUtilsSrv.prepareFields(promises.users, _fields);
                return promises.users;
            })
                .catch(errorHandler);
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
