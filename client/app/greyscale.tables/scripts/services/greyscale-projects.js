/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProjects', function ($q, greyscaleGlobals, greyscaleUtilsSrv, greyscaleProjectSrv,
                                            greyscaleOrganizationSrv, greyscaleUserSrv, greyscaleAccessSrv,
                                            greyscaleModalsSrv, inform, $log) {

        var dicts = {
            matrices: [],
            orgs: [],
            users: [],
            states: greyscaleGlobals.project_states
        };

        var recDescr = [
            {
                field: 'id',
                show: false,
                sortable: 'id',
                title: 'id'
            },
            {
                field: 'organizationId',
                show: false,
                sortable: 'organizationId',
                title: 'organizationId'
            },
            {
                field: 'organization',
                show: true,
                sortable: 'organization',
                title: 'Organization'
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
                title: 'Description'
            },
            {
                field: 'statusText',
                show: true,
                sortable: 'status',
                title: 'Status'
            },
            {
                field: 'created',
                dataFormat: 'date',
                show: true,
                sortable: 'created',
                title: 'Created'
            },
            {
                field: 'matrixId',
                show: false,
                sortable: 'matrixId',
                title: 'matrixId'
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
                show: false,
                sortable: 'status',
                title: 'status'
            },
            {
                field: 'adminUserId',
                show: false,
                sortable: 'adminUserId',
                title: 'adminUserId'
            },
            {
                field: 'admin',
                show: true,
                sortable: 'admin',
                title: 'Admin'
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
            title: 'Projects',
            icon: 'fa-paper-plane',
            cols: recDescr,
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _editProject
            }
        };

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

                    prj.created = prj.created?new Date(prj.created):null;
                    prj.startTime = prj.startTime?new Date(prj.startTime):null;
                    prj.closeTime = prj.closeTime?new Date(prj.closeTime):null;

                    prj.organization = greyscaleUtilsSrv.decode(promises.orgs, 'id', prj.organizationId, 'name');
                    prj.statusText = greyscaleUtilsSrv.decode(greyscaleGlobals.project_states, 'id', prj.status, 'name');
                    prj .admin = greyscaleUtilsSrv.decode(promises.usrs, 'id', prj.adminUserId, 'email');
                }
                dicts.matrices = promises.matrices;
                dicts.orgs = promises.orgs;
                dicts.users = promises.usrs;

                $log.debug(promises.prjs);
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
            greyscaleModalsSrv.editProject(prj, dicts)
                .then(function (newPrj) {
                    delete newPrj.organization;
                    delete newPrj.statusText;
                    delete newPrj.admin;
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
                var msg = 'Project ' + operation + ' error';
                $log.debug(err);
                if (err.data && err.data.message) {
                    msg += ': ' + err.data.message;
                }
                inform.add(msg, {type: 'danger'});
            }
        }

        return _table;
    });
