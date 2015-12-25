/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProjects', function ($q, greyscaleGlobals, greyscaleProjectSrv,
                                            greyscaleOrganizationSrv, greyscaleUserSrv, greyscaleAccessSrv,
                                            greyscaleModalsSrv, inform, $log) {

        var dicts = {
            matrices: [],
            orgs: [],
            users: []
        };

        var recDescr = [
            {
                field: 'id',
                show: false,
                sortable: 'id',
                title: 'ID',
                dataFormat: 'text',
                dataReadOnly: true
            },
            {
                field: 'organizationId',
                show: true,
                sortable: 'organizationId',
                title: 'Organization',
                dataFormat: 'option',
                dataReadOnly: true,
                dataSet: {
                    getData: getOrgs,
                    keyField: 'id',
                    valField: 'name'
                }
            },
            {
                field: 'codeName',
                show: true,
                sortable: 'codeName',
                title: 'Code Name'
            },
            {
                field: 'description',
                show: false,
                sortable: false,
                title: 'Description',
                dataFormat: 'textarea'
            },
            {
                field: 'created',
                dataFormat: 'date',
                show: true,
                sortable: 'created',
                title: 'Created',
                dataReadOnly: true
            },
            {
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
            },
            {
                field: 'startTime',
                dataFormat: 'date',
                show: true,
                sortable: 'startTime',
                title: 'Start Time'
            },
            {
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
            },
            {
                field: 'adminUserId',
                show: true,
                sortable: false,
                title: 'Admin',
                dataFormat: 'option',
                dataSet: {
                    getData: getUsers,
                    keyField: 'id',
                    valField: 'email'
                }
            },
            {
                field: 'closeTime',
                dataFormat: 'date',
                show: true,
                sortable: 'closeTime',
                title: 'Close Time'
            },
            {
                field: '',
                title: '',
                show: true,
                dataFormat: 'action',
                actions: [
                    {
                        icon: 'fa-pencil',
                        class: 'info',
                        handler: _editProject
                    },
                    {
                        icon: 'fa-trash',
                        class: 'danger',
                        handler: _delRecord
                    }
                ]
            }];

        var _table = {
            formTitle: 'Project',
            title: 'Projects',
            icon: 'fa-paper-plane',
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
            return greyscaleGlobals.project_states;
        }

        function _getData() {
            var req = {
                prjs: greyscaleProjectSrv.list(),
                orgs: greyscaleOrganizationSrv.list(),
                usrs: greyscaleUserSrv.list(),
                matrices: greyscaleAccessSrv.matrices()
            };

            return $q.all(req).then(function (promises) {
                for (var p = 0; p < promises.prjs.length; p++) {
                    var prj = promises.prjs[p];
                    for (var f=0; f<recDescr.length; f++) {
                        if (recDescr[f].dataFormat === 'date' && prj[recDescr[f].field]) {
                            prj[recDescr[f].field] = new Date(prj[recDescr[f].field]);
                        }
                    }
                }
                dicts.matrices = promises.matrices;
                dicts.orgs = promises.orgs;
                dicts.users = promises.usrs;

                return promises.prjs;
            });
        }

        function _delRecord(item) {
            greyscaleProjectSrv.delete(item.id)
                .then(reloadTable)
                .catch(function (err) {
                    errHandler(err, 'deleting');
                });
        }

        function _editProject(prj) {
            var op = 'editing';
            greyscaleModalsSrv.editProject(prj, _table)
                .then(function (newPrj) {
                    $log.debug(newPrj);
                    return true;

                    if (newPrj.id) {
                        return greyscaleProjectSrv.update(newPrj);
                    } else {
                        op = 'adding';
                        return greyscaleProjectSrv.add(newPrj);
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
            if (err) {
                var msg = _table.formTitle + operation + ' error';
                $log.debug(err);
                if (err.data && err.data.message) {
                    msg += ': ' + err.data.message;
                }
                inform.add(msg, {type: 'danger'});
            }
        }

        return _table;
    });
