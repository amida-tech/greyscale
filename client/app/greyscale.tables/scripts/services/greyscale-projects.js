/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProjects', function ($q, greyscaleGlobals, greyscaleUtilsSrv, greyscaleProjectSrv,
                                            greyscaleOrganizationSrv, greyscaleUserSrv, greyscaleAccessSrv,
                                            greyscaleModalsSrv, $log) {

        var dicts = {
            matrices: [],
            orgs: [],
            users: [],
            states: greyscaleGlobals.project_states
        };

        var _getData = function () {
            var req = {
                prjs: greyscaleProjectSrv.list(),
                orgs: greyscaleOrganizationSrv.list(),
                usrs: greyscaleUserSrv.list(),
                matrices: greyscaleAccessSrv.matrices()
            };

            return $q.all(req).then(function (promises) {
                for (var p = 0; p < promises.prjs.length; p++) {
                    promises.prjs[p].organization = greyscaleUtilsSrv.decode(promises.orgs, 'id', promises.prjs[p].organizationId, 'name');
                    promises.prjs[p].statusText = greyscaleUtilsSrv.decode(greyscaleGlobals.project_states, 'id', promises.prjs[p].status, 'name');
                    promises.prjs[p].admin = greyscaleUtilsSrv.decode(promises.usrs, 'id', promises.prjs[p].adminUserId, 'email');
                }
                dicts.matrices = promises.matrices;
                dicts.orgs = promises.orgs;
                dicts.users = promises.users;

                return promises.prjs;
            });
        };

        var _editProject = function (prj) {
            greyscaleModalsSrv.editProject(prj, dicts).then(function (_prj) {
                _prj = greyscaleUtilsSrv.removeInternal(_cols, _prj);
                $log.debug(_prj);
            });
        };

        var _cols = [
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
                internal: true,
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
                show: true,
                sortable: false,
                title: 'Description'
            },
            {
                internal: true,
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
                title: 'adminUserId',
                dataFormat: 'options',
                dataSource: dicts.users,
                dataSourceKey: 'id',
                dataSourceField: 'email'

            },
            {
                internal: true,
                field: 'admin',
                show: true,
                sortable: 'admin',
                title: 'Admin'
            },
            {
                field: 'closeTime',
                sortable: 'closeTime',
                show: true,
                title: 'Close Time',
                dataFormat: 'date'
            }
        ];

        return {
            title: 'Projects',
            icon: 'fa-paper-plane',
            cols: _cols,
            dataPromise: _getData,
            add: {
                title: 'Add',
                handler: _editProject
            }

        };
    });
