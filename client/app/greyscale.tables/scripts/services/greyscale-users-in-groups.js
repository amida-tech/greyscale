/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleUsersInGroupsTbl', function ($q, greyscaleModalsSrv,
        greyscaleUserGroupApi, greyscaleUtilsSrv) {

        var tns = 'USER_GROUPS.';

        var dicts = {

        };

        var _fields = [{
            field: 'usergroupId',
            title: tns + 'USER_GROUP',
            show: true,
            sortable: 'usergroupId',
            dataRequired: true
        }, {
            field: 'userId',
            title: tns + 'USER',
            show: true,
            sortable: 'userId'
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
            formTitle: tns + 'USERS_IN_GROUP',
            cols: _fields,
            dataPromise: _getUsersInGroups,
            pageLength: 10,
            sorting: {
                created: 'desc'
            },
            add: {
                handler: _editRecord
            }
        };

        function _delRecord(rec) {
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                group: rec,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleUserGroupApi.del(rec.id)
                    .then(reloadTable)
                    .catch(function (err) {
                        errorHandler(err, 'deleting');
                    });
            });
        }

        function _editRecord(group) {
            var action = 'adding';
            return greyscaleModalsSrv.editRec(group, _table)
                .then(function (rec) {
                    if (rec.id) {
                        action = 'editing';
                        return greyscaleUserGroupApi.update(rec);
                    } else {
                        rec.organizationId = _getOrganizationId();
                        return greyscaleUserGroupApi.id(rec);
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

        function _getOrganizationId() {
            return _table.dataFilter.organizationId;
        }

        function _getUsersInGroups() {
            var organizationId = _getOrganizationId();

            if (!organizationId) {
                return $q.reject('400');
            }

            var filter = {
                organizationId: organizationId
            };

            var reqs = {
                groups: greyscaleUserGroupApi.list(filter),
            };

            return $q.all(reqs).then(function (promises) {
                greyscaleUtilsSrv.prepareFields(promises.groups, _fields);
                return promises.groups;
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

        return _table;
    });
