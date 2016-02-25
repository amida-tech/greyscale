'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleUsersGroupsTbl', function ($q, _,
        greyscaleUserGroupApi,
        greyscaleModalsSrv,
        greyscaleUtilsSrv,
        inform) {

        var tns = 'USER_GROUPS.';

        var _cols = [{
            field: 'id',
            title: 'ID',
            show: false,
            sortable: 'id',
            dataReadOnly: 'both'
        }, {
            field: 'title',
            title: tns + 'NAME',
            show: true,
            sortable: 'title',
            dataRequired: true
        }, {
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-pencil',
                tooltip: 'COMMON.EDIT',
                handler: _editGroup
            }, {
                icon: 'fa-trash',
                tooltip: 'COMMON.DELETE',
                handler: _removeGroup
            }]
        }];

        var _table = {
            title: '',
            cols: _cols,
            sorting: {
                'id': 'asc'
            },
            dataPromise: _getData,
            dataFilter: {},
            formTitle: tns + 'USER_GROUP',
            pageLength: 10,
            add: {
                handler: _editGroup
            }
        };

        function _getOrganizationId() {
            return _table.dataFilter.organizationId;
        }

        function _getData() {
            var organizationId = _getOrganizationId();
            if (!organizationId) {
                return $q.reject();
            } else {
                var req = {
                    usergroups: greyscaleUserGroupApi.list(organizationId)
                };
                return $q.all(req).then(function (promises) {
                    return promises.usergroups;
                });
            }
        }

        function _editGroup(group) {
            var op = 'editing';
            greyscaleModalsSrv.editRec(group, _table)
                .then(function (editGroup) {
                    if (editGroup.id) {
                        return greyscaleUserGroupApi.update(editGroup);
                    } else {
                        op = 'adding';
                        var organizationId = _getOrganizationId();
                        return greyscaleUserGroupApi.add(organizationId, editGroup);
                    }
                })
                .then(_reload)
                .catch(function (err) {
                    return _errHandler(err, op);
                });
        }

        function _removeGroup(group) {
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                group: group,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleUserGroupApi.delete(group.id)
                    .then(_reload)
                    .catch(function (err) {
                        inform.add('Usergroup delete error: ' + err);
                    });
            });
        }

        function _reload() {
            _table.tableParams.reload();
        }

        function _errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
