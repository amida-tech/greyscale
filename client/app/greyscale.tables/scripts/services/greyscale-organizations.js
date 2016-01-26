/**
 * Created by igi on 28.12.15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleOrganizationsTbl', function ($q, greyscaleUtilsSrv, greyscaleOrganizationApi, greyscaleUserApi,
        greyscaleProfileSrv, greyscaleModalsSrv) {
        var _dicts = {
            users: []
        };
        var _fields = [{
            field: 'id',
            show: false,
            title: 'ID',
            dataReadOnly: 'both'
        }, {
            field: 'name',
            show: true,
            sortable: 'name',
            title: 'Name'
        }, {
            field: 'address',
            show: true,
            title: 'Address'
        }, {
            field: 'adminUserId',
            show: true,
            sortable: 'adminUserId',
            title: 'Admin user',
            dataFormat: 'option',
            dataSet: {
                keyField: 'id',
                valField: 'email',
                getData: getUsers
            }
        }, {
            field: 'url',
            show: true,
            title: 'Site URL'
        }, {
            field: 'enforceApiSecurity',
            show: false,
            dataReadOnly: 'both'
        }, {
            field: 'isActive',
            show: true,
            sortable: 'isActive',
            title: 'Is active',
            dataFormat: 'boolean',
            dataReadOnly: 'both'
        }, {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-pencil',
                class: 'info',
                handler: _editRecord
            }, {
                icon: 'fa-trash',
                class: 'danger',
                handler: _delRecord
            }]
        }];

        var _table = {
            formTitle: 'organization',
            title: 'Organizations',
            icon: 'fa-university',
            cols: _fields,
            dataPromise: getData,
            pageLength: 10,
            add: {
                title: 'Add',
                handler: _editRecord
            }

        };

        function getUsers() {
            return _dicts.users;
        }

        function _delRecord(rec) {
            greyscaleOrganizationApi.delete(rec.id)
                .then(reloadTable)
                .catch(function (err) {
                    errorHandler(err, 'deleting');
                });
        }

        function _editRecord(user) {
            var action = 'adding';
            return greyscaleModalsSrv.editRec(user, _table)
                .then(function (newRec) {
                    if (newRec.id) {
                        action = 'editing';
                        return greyscaleOrganizationApi.update(newRec);
                    } else {
                        return greyscaleOrganizationApi.add(newRec);
                    }
                })
                .then(reloadTable)
                .catch(function (err) {
                    errorHandler(err, action);
                });
        }

        function getData() {
            return greyscaleProfileSrv.getProfile()
                .then(function (profile) {
                    var reqs = {
                        orgs: greyscaleOrganizationApi.list(),
                        users: greyscaleUserApi.list({
                            organizationId: profile.organizationId
                        })
                    };

                    return $q.all(reqs).then(function (promises) {
                        _dicts.users = promises.users;
                        greyscaleUtilsSrv.prepareFields(promises.orgs, _fields);
                        return promises.orgs;
                    });
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
