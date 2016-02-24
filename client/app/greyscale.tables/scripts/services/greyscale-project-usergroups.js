'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleProjectUserGroupsTbl', function ($q, _,
        greyscaleUserGroupApi,
        greyscaleProjectApi,
        greyscaleProductApi,
        greyscaleModalsSrv,
        greyscaleUtilsSrv,
        greyscaleProductWorkflowApi,
        greyscaleGlobals,
        $state,
        inform, i18n) {

        var tns = 'PROJECTS.USER_GROUPS.';

        var _dicts = {
            surveys: []
        };

        var _const = {
            STATUS_PLANNING: 0,
            STATUS_STARTED: 1,
            STATUS_SUSPENDED: 2,
            STATUS_CANCELLED: 4
        };

        var _statusIcons = {};
        _statusIcons[_const.STATUS_STARTED] = 'fa-pause';
        _statusIcons[_const.STATUS_SUSPENDED] = 'fa-play';

        var _cols = [{
            field: 'name',
            title: tns + 'NAME',
            show: true,
            sortable: 'name',
            dataRequired: true
        }, {
            field: 'description',
            title: tns + 'DESCRIPTION',
            show: true,
            dataRequired: true,
            dataFormat: 'textarea'
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
            //formWarning: _getFormWarning,
            pageLength: 10,
            add: {
                handler: _editGroup
            }
        };

        function _getProjectId() {
            return _table.dataFilter.projectId;
        }

        function _getData() {
            var projectId = _getProjectId();
            if (!projectId) {
                return $q.reject();
            } else {
                var req = {
                    usergroups: greyscaleUserGroupApi.list({
                        projectId: projectId
                    })
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
                        editGroup.projectId = _getProjectId();
                        return greyscaleUserGroupApi.add(editGroup);
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
