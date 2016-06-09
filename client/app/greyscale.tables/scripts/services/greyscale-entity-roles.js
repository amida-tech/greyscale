/**
 * Created by igi on 28.12.15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleEntityRolesTbl', function ($q, _, greyscaleUtilsSrv, greyscaleProfileSrv, greyscaleModalsSrv,
        greyscaleEntityTypeRoleApi, greyscaleUserApi, greyscaleRoleApi,
        greyscaleEntityTypeApi, greyscaleRestSrv) {

        var tns = 'PROJECTS.ROLES.';

        var _dicts = {
            users: [],
            roles: [],
            entTypes: [],
            ents: {}
        };

        var _tableRestSrv = greyscaleEntityTypeRoleApi;

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
                field: 'roleId',
                show: true,
                title: tns + 'ROLE',
                sortable: 'roleId',
                dataRequired: true,
                dataFormat: 'option',
                dataSet: {
                    keyField: 'id',
                    valField: 'name',
                    getData: getRoles
                }
            },

            //{
            //    field: 'essenceId',
            //    show: true,
            //    title: 'Entity Type',
            //    dataReadOnly: 'both',
            //    dataRequired: true,
            //    dataFormat: 'option',
            //    dataSet: {
            //        keyField: 'id',
            //        valField: 'name',
            //        getData: getEntityTypes
            //    }
            //},
            //{
            //    field: 'entityId',
            //    show: true,
            //    title: 'Entity Title',
            //    dataReadOnly: 'both',
            //    dataRequired: true,
            //    dataFormat: 'option',
            //    dataSet: {
            //        keyField: 'id',
            //        valField: 'title',
            //        dataPromise: getEntity
            //    }
            //},
            {
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
            }
        ];

        var _table = {
            dataFilter: {},
            title: '',
            formTitle: tns + 'ITEM',
            formAddHeaderPrefix: 'COMMON.ASSIGN',
            cols: _fields,
            dataPromise: getData,
            add: {
                tooltip: 'COMMON.ASSIGN',
                handler: _editRecord
            }

        };

        function getUsers() {
            return _dicts.users;
        }

        function getRoles() {
            return _dicts.roles;
        }

        //function getEntityTypes() {
        //    return _dicts.entTypes;
        //}
        //
        //function getEntity(rec) {
        //    var dicId = rec.essenceId;
        //    var res = [];
        //    if (!_dicts.ents[dicId]) {
        //        _dicts.ents[dicId] = {
        //            promise: greyscaleEntityTypeApi.get(rec.essenceId)
        //                .then(function (eType) {
        //                    var apiName = eType[0].fileName;
        //                    var fieldName = eType[0].nameField;
        //                    var params = {
        //                        fields: 'id,' + fieldName
        //                    };
        //
        //                    return greyscaleRestSrv().one(apiName)
        //                        .get(params)
        //                        .then(function (items) {
        //                            var res = [];
        //                            for (var i = 0; i < items.length; i++) {
        //                                res.push({
        //                                    id: items[i].id,
        //                                    title: items[i][fieldName]
        //                                });
        //                            }
        //                            _dicts.ents[dicId].data = res;
        //                            return _dicts.ents[dicId].data;
        //                        });
        //                }),
        //            data: null
        //        };
        //        res = _dicts.ents[dicId].promise;
        //    } else if (!_dicts.ents[dicId].data) {
        //        res = _dicts.ents[dicId].promise;
        //    } else {
        //        res = $q.resolve(_dicts.ents[dicId].data);
        //    }
        //    return res;
        //}

        function _delRecord(entityRole) {
            var user = _.find(_dicts.users, {
                id: entityRole.userId
            });
            var role = _.find(_dicts.roles, {
                id: entityRole.roleId
            });
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                user: user,
                role: role,
                okType: 'danger',
                okText: 'COMMON.UNASSIGN'
            }).then(function () {
                _tableRestSrv.delete(entityRole.id)
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
            return greyscaleEntityTypeApi.list({
                    name: 'projects',
                    fields: 'id'
                })
                .then(function (types) {
                    _table.dataFilter.essenceId = types[0].id;
                    var organizationId = _table.dataFilter.organizationId;
                    var reqs = {
                        data: _tableRestSrv.list(_table.dataFilter),
                        users: greyscaleUserApi.list({
                            organizationId: organizationId
                        }),
                        roles: greyscaleRoleApi.list({
                            isSystem: false
                        }),
                        entTypes: greyscaleEntityTypeApi.list()
                    };

                    return $q.all(reqs).then(function (promises) {
                            _dicts.users = promises.users;
                            _dicts.roles = promises.roles;
                            _dicts.entTypes = promises.entTypes;

                            greyscaleUtilsSrv.prepareFields(promises.data, _fields);
                            return promises.data;
                        })
                        .catch(errorHandler);
                });
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
