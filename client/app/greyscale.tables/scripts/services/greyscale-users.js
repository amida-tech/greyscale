/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUsersTbl', function (_, $q, greyscaleModalsSrv, greyscaleUserApi, greyscaleGroupApi, greyscaleUtilsSrv,
        greyscaleProfileSrv, greyscaleGlobals) {
        var accessLevel;

        var tns = 'USERS.';

        var dicts = {};

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
            dataRequired: true
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
            sortable: 'isActive',
            dataFormat: 'boolean',
            dataReadOnly: 'both'
        }, {
            field: 'isAnonymous',
            title: tns + 'ANONYMOUS',
            show: true,
            sortable: 'isAnonymous',
            dataFormat: 'boolean'
        }, {
            show: true,
            title: tns + 'GROUPS',
            cellClass: 'text-center col-sm-2',
            dataReadOnly: 'both',
            dataHide: true,
            cellTemplate: '<small>{{ext.getGroups(row)}}</small><small class="text-muted" ng-hide="row.usergroupId.length" translate="' + tns + 'NO_GROUPS"></small> <a ng-show="widgetCell" class="action" ng-click="ext.editGroups(row); $event.stopPropagation()"><i class="fa fa-pencil"></i></a>',
            cellTemplateExtData: {
                getGroups: _getGroups,
                editGroups: _editGroups
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
            pageLength: 10,
            showAllButton: true,
            selectable: true,
            sorting: {
                created: 'desc'
            },
            add: {
                handler: _editRecord
            }
        };

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

        function _editRecord(user) {
            var action = 'adding';
            return greyscaleModalsSrv.editRec(user, _table)
                .then(function (newRec) {
                    if (newRec.id) {
                        action = 'editing';
                        return greyscaleUserApi.update(newRec);
                    } else {
                        newRec.organizationId = _getOrganizationId();
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

        function _isSuperAdmin() {
            return ((accessLevel & greyscaleGlobals.userRoles.superAdmin.mask) !== 0);
        }

        function _isAdmin() {
            return ((accessLevel & greyscaleGlobals.userRoles.admin.mask) !== 0);
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

                accessLevel = greyscaleProfileSrv.getAccessLevelMask();

                var listFilter = {
                    organizationId: organizationId
                };

                var reqs = {
                    users: greyscaleUserApi.list(listFilter),
                    groups: greyscaleGroupApi.list(organizationId),
                };

                return $q.all(reqs).then(function (promises) {
                    dicts.groups = promises.groups;
                    greyscaleUtilsSrv.prepareFields(promises.users, _fields);
                    return promises.users;
                });

            }).catch(errorHandler);
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
