/**
 * Created by igi on 12/23/15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleRightsTbl', function ($q, greyscaleRightApi, greyscaleModalsSrv, greyscaleEntityTypeApi,
        greyscaleUtilsSrv) {

        var tns = 'RIGHTS.';

        var _dicts = {
            entityTypes: []
        };

        var _fields = [{
            field: 'id',
            title: 'ID',
            show: false,
            sortable: 'id',
            dataFormat: 'text',
            dataReadOnly: 'both'
        }, {
            field: 'action',
            title: tns + 'ACTION',
            show: true,
            sortable: 'action'
        }, {
            field: 'description',
            title: tns + 'DESCRIPTION',
            show: true,
            sortable: false,
            dataFromat: 'textarea'
        }, {
            field: 'essenceId',
            title: tns + 'ENTITY_TYPE',
            show: true,
            sortable: false,
            dataFormat: 'option',
            dataSet: {
                getData: getEntityTypes,
                keyField: 'id',
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
                handler: _edtRight
            }, {
                icon: 'fa-trash',
                tooltip: 'COMMON.DELETE',
                handler: delRigth
            }]
        }];

        var _table = {
            formTitle: tns + 'RIGHT',
            title: tns + 'RIGHTS',
            icon: 'fa-tasks',
            cols: _fields,
            dataPromise: _getRights,
            add: {
                handler: _edtRight
            }
        };

        function _getRights() {
            var _reqs = {
                rights: greyscaleRightApi.list(),
                eTypes: greyscaleEntityTypeApi.list({
                    fields: 'id,name'
                })
            };
            return $q.all(_reqs).then(function (promises) {
                promises.eTypes.unshift({
                    'id': null,
                    'name': ''
                });
                _dicts.entityTypes = promises.eTypes;
                greyscaleUtilsSrv.prepareFields(promises.rights, _fields);
                return promises.rights;
            });
        }

        function getEntityTypes() {
            return _dicts.entityTypes;
        }

        function _edtRight(_right) {
            var action = 'adding';
            return greyscaleModalsSrv.editRec(_right, _table)
                .then(function (newRight) {
                    delete newRight.entityType;
                    if (newRight.id) {
                        action = 'editing';
                        return greyscaleRightApi.update(newRight);
                    } else {
                        return greyscaleRightApi.add(newRight);
                    }
                })
                .then(_reloadRights)
                .catch(function (err) {
                    errHandler(err, action);
                });
        }

        function _reloadRights() {
            _table.tableParams.reload();
        }

        function delRigth(right) {
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                right: right,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleRightApi.delete(right.id)
                    .then(_reloadRights)
                    .catch(function (err) {
                        errHandler(err, 'deleting');
                    });
            });
        }

        function errHandler(err, action) {
            var msg = _table.formTitle + ' ' + action + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
