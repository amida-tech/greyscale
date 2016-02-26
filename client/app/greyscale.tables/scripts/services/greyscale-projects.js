/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProjectsTbl', function ($q, greyscaleGlobals, greyscaleProjectApi, greyscaleProfileSrv,
        greyscaleOrganizationApi, greyscaleAccessApi,
        greyscaleModalsSrv, greyscaleUtilsSrv) {

        var tns = 'PROJECTS.';

        var dicts = {
            matrices: [],
            orgs: []
        };

        var recDescr = [{
            field: 'id',
            show: false,
            sortable: 'id',
            title: 'ID',
            dataFormat: 'text',
            dataReadOnly: 'both'
        }, {
            field: 'codeName',
            show: true,
            sortable: 'codeName',
            title: tns + 'CODE_NAME',
            dataRequired: true
        }, {
            field: 'description',
            show: false,
            sortable: false,
            title: tns + 'DESCRIPTION',
            dataFormat: 'textarea'
        }, {
            field: 'created',
            dataFormat: 'date',
            show: true,
            sortable: 'created',
            title: tns + 'CREATED',
            dataReadOnly: 'both'
        }, {
            field: 'matrixId',
            show: false,
            sortable: 'matrixId',
            title: tns + 'ACCESS_MATRIX',
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
            title: tns + 'START_TIME'
        }, {
            field: 'status',
            show: true,
            sortable: 'status',
            title: tns + 'STATUS',
            dataFormat: 'option',
            dataNoEmptyOption: true,
            dataSet: {
                getData: getStatus,
                keyField: 'id',
                valField: 'name'
            }
        }, {
            field: 'closeTime',
            dataFormat: 'date',
            show: true,
            sortable: 'closeTime',
            title: tns + 'CLOSE_TIME'
        }, {
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-pencil',
                tooltip: 'COMMON.EDIT',
                handler: _editProject
            }, {
                icon: 'fa-trash',
                tooltip: 'COMMON.DELETE',
                handler: _delRecord
            }]
        }];

        var _table = {
            formTitle: tns + 'ITEM',
            title: tns + 'HEADER',
            icon: 'fa-paper-plane',
            pageLength: 10,
            cols: recDescr,
            sorting: {
                id: 'asc'
            },
            selectable: true,
            dataPromise: _getData,
            add: {
                title: 'COMMON.CREATE',
                handler: _editProject
            },
            dataFilter: {}
        };

        function getMatrices() {
            return dicts.matrices;
        }

        function getStatus() {
            return greyscaleGlobals.projectStates;
        }

        function _getOrganizationId() {
            return _table.dataFilter.organizationId;
        }

        function _getData() {

            var organizationId = _getOrganizationId();

            if (!organizationId) {
                return $q.reject('400');
            }

            var req = {
                prjs: greyscaleProjectApi.list({
                    organizationId: organizationId
                }),
                matrices: greyscaleAccessApi.matrices()
            };

            return $q.all(req).then(function (promises) {
                    greyscaleUtilsSrv.prepareFields(promises.prjs, recDescr);

                    dicts.matrices = promises.matrices;

                    return promises.prjs;
                })
                .catch(function (err) {
                    return errHandler(err);
                });

        }

        function _delRecord(project) {
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                project: project,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleProjectApi.delete(project.id)
                    .then(reloadTable)
                    .catch(function (err) {
                        errHandler(err, 'deleting');
                    });
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
                        newPrj.organizationId = _getOrganizationId();
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
