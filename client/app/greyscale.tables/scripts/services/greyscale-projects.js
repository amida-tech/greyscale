/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProjectsTbl', function ($q, greyscaleGlobals, greyscaleProjectApi, greyscaleProfileSrv,
        greyscaleOrganizationApi, greyscaleUserApi, greyscaleAccessApi,
        greyscaleModalsSrv, greyscaleUtilsSrv) {

        var dicts = {
            matrices: [],
            orgs: [],
            users: []
        };

        var accessLevel;

        var recDescr = [{
            field: 'id',
            show: false,
            sortable: 'id',
            title: 'ID',
            dataFormat: 'text',
            dataReadOnly: 'both'
        }, {
            field: 'organizationId',
            show: _isSuperAdmin,
            sortable: 'organizationId',
            title: 'Organization',
            dataFormat: 'option',
            dataReadOnly: 'both',
            dataSet: {
                getData: getOrgs,
                keyField: 'id',
                valField: 'name'
            }
        }, {
            field: 'codeName',
            show: true,
            sortable: 'codeName',
            title: 'Code Name',
            dataRequired: true
        }, {
            field: 'description',
            show: false,
            sortable: false,
            title: 'Description',
            dataFormat: 'textarea'
        }, {
            field: 'created',
            dataFormat: 'date',
            show: true,
            sortable: 'created',
            title: 'Created',
            dataReadOnly: 'both'
        }, {
            field: 'matrixId',
            show: false,
            sortable: 'matrixId',
            title: 'Access matrix',
            dataFormat: 'option',
            dataSet: {
                getData: getMatrices,
                keyField: 'id',
                valField: 'name'
            }
        }, {
            field: 'startTime',
            dataFormat: 'date',
            show: true,
            sortable: 'startTime',
            title: 'Start Time'
        }, {
            field: 'status',
            show: true,
            sortable: 'status',
            title: 'Status',
            dataFormat: 'option',
            dataSet: {
                getData: getStatus,
                keyField: 'id',
                valField: 'name'
            }
        }, {
            field: 'adminUserId',
            show: _isSuperAdmin,
            sortable: false,
            title: 'Admin',
            dataFormat: 'option',
            dataSet: {
                getData: getUsers,
                keyField: 'id',
                valField: 'email'
            },
            dataReadOnly: 'both'
        }, {
            field: 'closeTime',
            dataFormat: 'date',
            show: true,
            sortable: 'closeTime',
            title: 'Close Time'
        }, {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-pencil',
                class: 'info',
                handler: _editProject
            }, {
                icon: 'fa-trash',
                class: 'danger',
                handler: _delRecord
            }]
        }];

        var _table = {
            formTitle: 'Project',
            title: 'Projects',
            icon: 'fa-paper-plane',
            pageLength: 10,
            cols: recDescr,
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _editProject
            }
        };

        function getOrgs() {
            return dicts.orgs;
        }

        function getMatrices() {
            return dicts.matrices;
        }

        function getUsers() {
            return dicts.users;
        }

        function getStatus() {
            return greyscaleGlobals.projectStates;
        }

        function _isSuperAdmin() {
            return accessLevel === greyscaleGlobals.userRoles.superAdmin.mask;
        }

        function _setAccessLevel() {
            accessLevel = greyscaleProfileSrv.getAccessLevelMask();
        }

        function _getData() {
            return greyscaleProfileSrv.getProfile().then(function (profile) {

                _setAccessLevel();

                var req = {
                    prjs: greyscaleProjectApi.list({
                        organizationId: profile.organizationId
                    }),
                    orgs: greyscaleOrganizationApi.list({
                        organizationId: profile.organizationId
                    }),
                    usrs: greyscaleUserApi.list({
                        organizationId: profile.organizationId
                    }),
                    matrices: greyscaleAccessApi.matrices()
                };

                return $q.all(req).then(function (promises) {
                    greyscaleUtilsSrv.prepareFields(promises.prjs, recDescr);

                    dicts.matrices = promises.matrices;
                    dicts.orgs = promises.orgs;
                    dicts.users = promises.usrs;

                    return promises.prjs;
                });

            });
        }

        function _delRecord(item) {
            greyscaleProjectApi.delete(item.id)
                .then(reloadTable)
                .catch(function (err) {
                    errHandler(err, 'deleting');
                });
        }

        function _editProject(prj) {
            var op = 'editing';
            greyscaleModalsSrv.editRec(prj, _table)
                .then(function (newPrj) {
                    if (newPrj.id) {
                        return greyscaleProjectApi.update(newPrj);
                    } else {
                        op = 'adding';
                        return greyscaleProjectApi.add(newPrj);
                    }
                })
                .then(reloadTable)
                .catch(function (err) {
                    return errHandler(err, op);
                });
        }

        function reloadTable() {
            _table.tableParams.reload();
        }

        function errHandler(err, operation) {
            var msg = _table.formTitle + ' ' + operation + ' error';
            greyscaleUtilsSrv.errorMsg(err, msg);
        }

        return _table;
    });
