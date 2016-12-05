/**
 * Created by igi on 28.12.15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleWorkflowTemplatesTbl', function ($q, i18n,
        greyscaleUtilsSrv,
        greyscaleWorkflowTemplateApi,
        greyscaleUserApi,
        greyscaleProfileSrv,
        greyscaleModalsSrv) {

        var tns = 'WORKFLOW_TEMPLATES.';

        var _dicts = {};

        var _fields = [{
            field: 'id',
            show: false
        }, {
            field: 'workflow.name',
            sortable: 'workflow.name',
            title: tns + 'TITLE',
            show: true,
            dataRequired: true
        }, {
            field: 'workflow.description',
            title: tns + 'DESCRIPTION',
            show: true
        }, {
            title: tns + 'STEPS',
            show: true,
            cellTemplate: '<small class="text-muted">{{ext.getSteps(row)}}</small>',
            cellTemplateExtData: {
                getSteps: _getSteps
            }
        }, {
            show: true,
            dataFormat: 'action',
            actions: [{
                icon: 'fa-clone',
                tooltip: 'COMMON.COPY',
                handler: _copyWorkflowTemplate
            }, {
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
            formTitle: tns + 'WORKFLOW_TEMPLATE',
            title: tns + 'WORKFLOW_TEMPLATES',
            icon: 'fa-road',
            cols: _fields,
            sorting: {
                'workflow.name': 'asc'
            },
            dataPromise: getData,
            dataFilter: {},
            add: {
                handler: _editWorkflowTemplate
            }
        };

        function _editWorkflowTemplate(template) {
            var action = template && template.id ? 'UPDATE' : 'ADD';

            var modalData = {
                title: tns + 'WORKFLOW_TEMPLATE',
                product: template || {
                    workflow: {}
                }
            };

            greyscaleModalsSrv.productWorkflow(modalData)
                .then(function (data) {
                    _saveWorkflowTemplate(action, data);
                });

        }

        function _copyWorkflowTemplate(template) {
            template.id = undefined;
            template.workflow.name += ' ' + i18n.translate('COMMON.THE_COPY');
            _saveWorkflowTemplate('copy', template);
        }

        function _saveWorkflowTemplate(action, template) {
            var method = template.id ? 'update' : 'add';
            greyscaleWorkflowTemplateApi[method](template)
                .catch(function (err) {
                    errorHandler(err, action);
                })
                .then(reloadTable);
        }

        function _delRecord(rec) {
            greyscaleModalsSrv.confirm({
                message: tns + 'DELETE_CONFIRM',
                template: rec,
                okType: 'danger',
                okText: 'COMMON.DELETE'
            }).then(function () {
                greyscaleWorkflowTemplateApi.remove(rec.id)
                    .then(reloadTable)
                    .catch(function (err) {
                        errorHandler(err, 'DELETE');
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
                    _dicts.workflowtemplates = promises.workflowTemplates;
                    return promises.workflowTemplates;
                })
                .catch(errorHandler);
        }

        function reloadTable() {
            _table.tableParams.reload();
        }

        function errorHandler(err, action) {
            greyscaleUtilsSrv.apiErrorMessage(err, action, _table.formTitle);
        }

        function _getSteps(template) {
            return _.map(template.steps, function (o) {
                return o.title;
            }).join(', ');
        }

        return _table;
    });
