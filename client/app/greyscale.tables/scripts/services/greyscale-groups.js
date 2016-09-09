'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleGroupsTbl', function ($q, _,
        greyscaleGroupApi,
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
                    groups: greyscaleGroupApi.list(organizationId)
                };
                return $q.all(req).then(function (promises) {
                    return promises.groups;
                });
            }
        }

        function _editGroup(group) {
            var op = 'UPDATE';
            greyscaleModalsSrv.editRec(group, _table)
                .then(function (editGroup) {
                    if (editGroup.id) {
                        return greyscaleGroupApi.update(editGroup);
                    } else {
                        op = 'ADD';
                        var organizationId = _getOrganizationId();
                        return greyscaleGroupApi.add(organizationId, editGroup);
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
                greyscaleGroupApi.delete(group.id)
                    .then(_reload)
                    .catch(function (err) {
                        _errHandler(err, 'DELETE');
                    });
            });
        }

        function _reload() {
            _table.tableParams.reload();
        }

        function _errHandler(err, action) {
            greyscaleUtilsSrv.apiErrorMessage(err, action, _table.formTitle);
        }

        return _table;
    });
