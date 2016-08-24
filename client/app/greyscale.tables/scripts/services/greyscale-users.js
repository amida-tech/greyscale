/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUsersTbl',
        function (_, $q, greyscaleModalsSrv, greyscaleUserApi, greyscaleUtilsSrv, inform, i18n,
            greyscaleProfileSrv, greyscaleGlobals, greyscaleRolesSrv, greyscaleNotificationApi, greyscaleGroupApi) {

            var tns = 'USERS.';

            var dicts = {
                users: []
            };

            var _fields = [{
                field: 'id',
                title: 'ID',
                show: false,
                sortable: 'id',
                dataReadOnly: 'both',
                dataHide: _isProfileEdit
            }, {
                field: 'email',
                title: tns + 'EMAIL',
                show: false,
                sortable: 'email',
                dataRequired: true,
                dataValidate: ['email', {
                    unique: {
                        storage: dicts,
                        dict: 'users',
                        field: 'email',
                        caseSensitive: false
                    }
                }]
            }, {
                field: 'firstName',
                title: tns + 'FIRST_NAME',
                show: true,
                sortable: 'firstName',
                dataRequired: true
            }, {
                field: 'lastName',
                title: tns + 'LAST_NAME',
                show: true,
                sortable: 'lastName'
            }, {
                field: 'roleID',
                title: tns + 'ROLE',
                dataFormat: 'option',
                dataNoEmptyOption: true,
                dataSet: {
                    getData: _getRoles,
                    keyField: 'id',
                    valField: 'title'
                }
            }, {
                field: 'lastActive',
                title: tns + 'LAST_ACTIVE',
                show: true,
                sortable: 'lastActive',
                dataReadOnly: 'both',
                cellTemplate: '<span ng-hide="cell" translate="USERS.NOT_LOGGED"></span>{{cell|date:\'medium\'}}'
            }, {
                field: 'isActive',
                title: tns + 'IS_ACTIVE',
                show: true,
                textCenter: true,
                sortable: 'isActive',
                dataFormat: 'boolean',
                dataReadOnly: 'new'
            }, {
                field: 'isAnonymous',
                title: tns + 'ANONYMOUS',
                show: true,
                textCenter: true,
                sortable: 'isAnonymous',
                dataFormat: 'boolean'
            }, {
                show: true,
                title: tns + 'GROUPS',
                cellClass: 'col-sm-2',
                dataReadOnly: 'both',
                dataHide: true,
                cellTemplate: '<small>{{ext.getGroups(row)}}</small><small class="text-muted" ng-hide="row.usergroupId.length" translate="' + tns + 'NO_GROUPS"></small> <a ng-show="widgetCell" class="action" ng-click="ext.editGroups(row); $event.stopPropagation()"><i class="fa fa-pencil"></i></a>',
                cellTemplateExtData: {
                    getGroups: _getGroups,
                    editGroups: _editGroups
                }
            }, {
                title: '',
                show: false,
                cellTemplate: '<a ng-click="ext.resendActivation(row)" class="btn btn-primary" translate="' + tns + 'RESEND_ACTIVATION"></a>',
                cellTemplateExtData: {
                    resendActivation: _resendActivation
                },
                dataHide: function(row){
                    return row.isActive;
                }
            }, {
                title: 'COMMON.SEND_MESSAGE',
                viewHide: true,
                textCenter: true,
                cellTemplate: '<a ng-click="ext.sendMessageTo(row); $event.stopPropagation()" class="action">' +
                    '       <i ng-if="ext.anotherUser(row)" class="fa fa-envelope"></i>' +
                    '   </a>',
                dataHide: true,
                cellTemplateExtData: {
                    anotherUser: _isAnotherUser,
                    sendMessageTo: _sendMessageTo
                }
            }, {
                field: 'notifyLevel',
                title: tns + 'NOTIFY_LEVEL',
                dataFormat: 'option',
                //cellTemplate: '{{cell}}',
                dataNoEmptyOption: true,
                dataSet: {
                    getData: _getNotifyLevels,
                    keyField: 'value',
                    valField: 'name'
                }
            }, {
                field: '',
                title: '',
                show: true,
                dataFormat: 'action',
                actions: [{
                    icon: 'fa-pencil',
                    tooltip: 'COMMON.EDIT',
                    handler: _editRecord
                }, {
                    icon: 'fa-lock',
                    tooltip: tns + 'CHANGE_PASSWORD',
                    handler: _changePassword
                }, {
                    icon: 'fa-trash',
                    tooltip: 'COMMON.DELETE',
                    handler: _delRecord
                }]
            }];

            var _table = {
                dataFilter: {},
                formTitle: tns + 'USER',
                cols: _fields,
                dataPromise: _getUsers,
                selectable: true,
                sorting: {
                    created: 'desc'
                },
                add: {
                    handler: _editRecord
                }
            };

            function _getRoles() {
                return dicts.roles;
            }

            function _getNotifyLevels() {
                return greyscaleGlobals.notifyLevels;
            }

            function _getGroups(user) {
                return _.map(_.filter(dicts.groups, function (o) {
                    return ~user.usergroupId.indexOf(o.id);
                }), 'title').join(', ');
            }

            function _delRecord(rec) {
                greyscaleModalsSrv.confirm({
                    message: tns + 'DELETE_CONFIRM',
                    user: rec,
                    okType: 'danger',
                    okText: 'COMMON.DELETE'
                }).then(function () {
                    greyscaleUserApi.delete(rec.id)
                        .then(reloadTable)
                        .catch(function (err) {
                            errorHandler(err, 'deleting');
                        });
                });
            }

            function _isAnotherUser(user) {
                return user.id !== dicts.profile.id;
            }

            function _sendMessageTo(user) {
                greyscaleModalsSrv.sendNotification(user);
            }

            function _changePassword(user) {
                greyscaleModalsSrv.changePassword(user);
            }

            function _editRecord(user) {
                var action = 'adding';
                return greyscaleModalsSrv.editRec(user, _table)
                    .then(function (newRec) {
                        if (newRec.password) {
                            delete(newRec.password);
                        }
                        if (newRec.id) {
                            action = 'editing';
                            return greyscaleUserApi.update(newRec);
                        } else {
                            newRec.organizationId = _getOrganizationId();
                            return greyscaleUserApi.inviteUser(newRec);
                            /*
                             if (_isSuperAdmin()) {
                             return greyscaleUserApi.inviteAdmin(newRec);
                             } else if (_isAdmin()) {
                             return greyscaleUserApi.inviteUser(newRec);
                             }
                             */
                        }
                    })
                    .then(reloadTable)
                    .catch(function (err) {
                        errorHandler(err, action);
                    });
            }

            function _resendActivation(user) {
                greyscaleNotificationApi.resendUserInvite(user.id)
                    .then(function () {
                        inform.add(i18n.translate(tns + 'RESEND_ACTIVATION_DONE'), {
                            type: 'success'
                        });
                    })
                    .catch(function (err) {
                        greyscaleUtilsSrv.errorMsg(err, 'Resend Activation');
                    });
            }

            function _editGroups(user) {
                greyscaleModalsSrv.userGroups(user)
                    .then(function (selectedGroupIds) {
                        user.usergroupId = selectedGroupIds;
                        greyscaleUserApi.update(user);
                    });
            }

            function reloadTable() {
                _table.tableParams.reload();
            }

            function _getOrganizationId() {
                return _table.dataFilter.organizationId;
            }

            function _getUsers() {

                var organizationId = _getOrganizationId();

                if (!organizationId) {
                    return $q.reject('400');
                }

                return greyscaleProfileSrv.getProfile().then(function (profile) {
                    var reqs = {
                        roles: greyscaleRolesSrv(),
                        users: greyscaleUserApi.list(),
                        groups: greyscaleGroupApi.list(organizationId)
                    };

                    dicts.profile = profile;
                    return $q.all(reqs).then(function (promises) {
                        var _roles = _.filter(promises.roles, function (o) {
                            return o.isSystem && o.id !== greyscaleGlobals.userRoles.superAdmin.id && o.id >= dicts.profile.roleID;
                        });

                        dicts.roles = _addTitles(_roles);
                        dicts.groups = promises.groups;
                        greyscaleUtilsSrv.prepareFields(promises.users, _fields);
                        dicts.users = promises.users;
                        return promises.users;
                    });

                }).catch(errorHandler);
            }

            function _addTitles(roles) {
                angular.forEach(roles, function (role) {
                    role.title = i18n.translate('GLOBALS.ROLES.' + role.name.toUpperCase());
                });
                return roles;
            }

            function errorHandler(err, action) {
                var msg = _table.formTitle;
                if (action) {
                    msg += ' ' + action;
                }
                msg += ' error';
                greyscaleUtilsSrv.errorMsg(err, msg);
            }

            function _isProfileEdit() {
                return (!!_table.profileMode);
            }

            return _table;
        });
