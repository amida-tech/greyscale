/**
 * Created by igi on 28.12.15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleWorkflowTemplatesTbl', function ($q,
        greyscaleUtilsSrv,
        greyscaleWorkflowTemplateApi,
        greyscaleUserApi,
        greyscaleProfileSrv,
        greyscaleModalsSrv,
        greyscaleRolesSrv,
        greyscaleGlobals,
        $rootScope) {

        var tns = 'WORKFLOW_TEMPLATES.';

        var _dicts = {};

        var _fields = [{
            field: 'workflow.name',
            sortable: 'workflow.name',
            title: tns + 'TITLE',
            show: true
        }, {
            field: 'workflow.description',
            title: tns + 'DESCRIPTION',
            show: true
        }, {
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-pencil',
                tooltip: 'COMMON.EDIT',
                handler: _editWorkflowTemplate
            }, {
                icon: 'fa-trash',
                tooltip: 'COMMON.DELETE',
                handler: _delRecord
            }]
        }];

        var _table = {
            title: tns + 'WORKFLOW_TEMPLATES',
            icon: 'fa-road',
            cols: _fields,
            dataPromise: getData,
            dataFilter: {},
            add: {
                handler: _editWorkflowTemplate
            }
        };

        function _editWorkflowTemplate(template) {
            var action = 'adding';

            var modalParams = {
                title: tns + 'WORKFLOW_TEMPLATE'
            };

            greyscaleModalsSrv.productWorkflow(template || {}, modalParams)
                .then(function (data) {
                    console.log(data);
                    // return _saveWorkflowAndSteps(product, data);
                })
                .then(reloadTable);

            // _table.dataFilter.formRecord = workflowTemplate;
            // return greyscaleModalsSrv.editRec(organization, _table)
            //     .then(function (newRec) {
            //         if (newRec.id) {
            //             action = 'editing';
            //             return greyscaleOrganizationApi.update(newRec, organization.realm);
            //         } else {
            //             return greyscaleOrganizationApi.add(newRec, 'public');
            //         }
            //     })
            //     .then(reloadTable)
            //     .catch(function (err) {
            //         errorHandler(err, action);
            //     })
            //     .finally(function () {
            //         delete(_table.dataFilter.formRecord);
            //     });
        }

        function _delRecord(rec) {
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                template: rec,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleWorkflowTemplateApi.delete(rec.id)
                    .then(reloadTable)
                    .catch(function (err) {
                        errorHandler(err, 'deleting');
                    });
            });
        }

        function getData() {
            var reqs = {
                workflowTemplates: greyscaleWorkflowTemplateApi.list()
            };

            return $q.all(reqs)
                .then(function (promises) {
                    greyscaleUtilsSrv.prepareFields(promises.workflowTemplates, _fields);
                    return promises.workflowTemplates;
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
