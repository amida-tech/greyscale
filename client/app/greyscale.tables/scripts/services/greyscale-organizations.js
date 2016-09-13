/**
 * Created by igi on 28.12.15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleOrganizationsTbl', function ($q, greyscaleUtilsSrv, greyscaleOrganizationApi, greyscaleUserApi,
        greyscaleProfileSrv, greyscaleModalsSrv, greyscaleRolesSrv, greyscaleGlobals, $rootScope) {

        var tns = 'ORGANIZATIONS.';

        var _dicts = {
            users: []
        };
        var _fields = [{
            field: 'id',
            show: false,
            title: 'ID',
            dataReadOnly: 'both'
        }, {
            field: 'realm',
            show: true,
            title: 'Realm',
            dataReadOnly: 'edit',
            dataRequired: true
        }, {
            field: 'name',
            show: true,
            sortable: 'name',
            title: tns + 'NAME',
            dataRequired: true
        }, {
            field: 'address',
            show: true,
            title: tns + 'ADDRESS'
        }, {
            field: 'url',
            show: true,
            title: tns + 'SITE_URL'
        }, {
            field: 'enforceApiSecurity',
            show: false,
            dataReadOnly: 'both'
        }, {
            field: 'isActive',
            show: true,
            sortable: 'isActive',
            title: tns + 'IS_ACTIVE',
            dataFormat: 'boolean',
            dataReadOnly: _getActivationMode
        }, {
            field: 'adminUserId',
            show: false,
            title: tns + 'ADMIN_USER',
            dataFormat: 'option',
            dataNoEmptyOption: true,
            dataSet: {
                dataPromise: _getAdmins,
                keyField: 'id',
                valField: 'email'
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
            }]
        }];

        var _table = {
            formTitle: tns + 'ORGANIZATION',
            title: tns + 'ORGANIZATIONS',
            icon: 'fa-university',
            cols: _fields,
            dataPromise: getData,
            dataFilter: {},
            add: {
                handler: _editRecord
            }
        };

        function _editRecord(organization) {
            var action = 'adding';
            _table.dataFilter.formRecord = organization;
            return greyscaleModalsSrv.editRec(organization, _table)
                .then(function (newRec) {
                    if (newRec.id) {
                        action = 'editing';
                        return greyscaleOrganizationApi.update(newRec, organization.realm);
                    } else {
                        return greyscaleOrganizationApi.add(newRec, 'public');
                    }
                })
                .then(reloadTable)
                .catch(function (err) {
                    errorHandler(err, action);
                })
                .finally(function () {
                    delete(_table.dataFilter.formRecord);
                });
        }

        function getData() {
            var reqs = {
                orgs: greyscaleOrganizationApi.list({}, 'public'),
                users: greyscaleUserApi.list({}, 'public')
            };

            return $q.all(reqs)
                .then(function (promises) {
                    _dicts.users = promises.users;
                    greyscaleUtilsSrv.prepareFields(promises.orgs, _fields);
                    return promises.orgs;
                })
                .catch(errorHandler);
        }

        function reloadTable() {
            $rootScope.$broadcast(greyscaleGlobals.events.common.orgUpdate);
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

        function _getActivationMode() {
            return greyscaleProfileSrv.isSuperAdmin() ? false : 'both';
        }

        function _getAdmins(rec) {
            if (rec.realm) {
                return greyscaleRolesSrv(rec.realm)
                    .then(function (roles) {
                        var r,
                            qty = roles.length,
                            res;

                        for (r = 0; r < qty && !res; r++) {
                            if (roles[r].name === greyscaleGlobals.userRoles.admin.key) {
                                res = roles[r].id;
                            }
                        }
                        return res;
                    })
                    .then(function (adminRoleId) {
                        var _params = {
                            roleID: adminRoleId,
                            field: ['id', 'email', 'firstName', 'lastName']
                        };
                        return greyscaleUserApi.list(_params, rec.realm);
                    });
            } else {
                return $q.resolve([]);
            }
        }

        return _table;
    });
