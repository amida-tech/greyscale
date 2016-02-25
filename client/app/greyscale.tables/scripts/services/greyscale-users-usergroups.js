/**
 * Created by igi on 28.12.15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleUsersUserGroupsTbl', function ($q, _, greyscaleUtilsSrv,
        greyscaleProfileSrv, greyscaleModalsSrv, greyscaleUserGroupApi,
        greyscaleUserUserGroupApi, greyscaleUserApi) {

        var tns = 'USER_USER_GROUPS.';

        var _dicts = {
            users: [],
            usergroups: []
        };

        var _tableRestSrv = greyscaleUserUserGroupApi;

        var _fields = [{
            field: 'userId',
            show: true,
            title: tns + 'USER',
            sortable: 'userId',
            dataRequired: true,
            cellTemplate: '{{option.firstName}} {{option.lastName}} <small>({{option.email}})</small>',
            dataFormat: 'option',
            dataSet: {
                keyField: 'id',
                template: '{{option.firstName}} {{option.lastName}} ({{option.email}})',
                getData: getUsers
            }
        }, {
            field: 'usergroupId',
            show: true,
            title: tns + 'USER_GROUP',
            sortable: 'usergroupId',
            dataRequired: true,
            dataFormat: 'option',
            dataSet: {
                keyField: 'id',
                valField: 'title',
                getData: getUserGroups
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
                tooltip: 'COMMON.UNASSIGN',
                handler: _delRecord
            }]
        }];

        var _table = {
            dataFilter: {},
            title: '',
            formTitle: tns + 'ITEM',
            cols: _fields,
            dataPromise: getData,
            pageLength: 10,
            add: {
                handler: _editRecord
            }

        };

        function getUsers() {
            return _dicts.users;
        }

        function getUserGroups() {
            return _dicts.usergroups;
        }

        function _delRecord(userUserGroup) {
            var user = _.find(_dicts.users, {
                id: userUserGroup.userId
            });
            var usergroup = _.find(_dicts.usergroups, {
                id: userUserGroup.usergroupId
            });
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                user: user,
                usergroup: usergroup,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                _tableRestSrv.delete(userUserGroup.id)
                    .then(reloadTable)
                    .catch(function (err) {
                        errorHandler(err, 'deleting');
                    });
            });
        }

        function _editRecord(rec) {
            var action = (typeof rec === 'undefined') ? 'adding' : 'editing';
            if (!rec) {
                rec = {};
            }
            rec = angular.extend(rec, _table.dataFilter);
            return greyscaleModalsSrv.editRec(rec, _table)
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
            var projectId = _table.dataFilter.projectId;
            var organizationId = _table.dataFilter.organizationId;
            if (!projectId || !organizationId) {
                return $q.reject('400');
            }
            var dataFilter = {
                projectId: projectId
            };
            var reqs = {
                data: _tableRestSrv.list(dataFilter),
                users: greyscaleUserApi.list({
                    organizationId: organizationId
                }),
                usergroups: greyscaleUserGroupApi.list(organizationId)
            };

            return $q.all(reqs).then(function (promises) {
                    _dicts.users = promises.users;
                    _dicts.usergroups = promises.usergroups;

                    greyscaleUtilsSrv.prepareFields(promises.data, _fields);
                    return promises.data;
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
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
