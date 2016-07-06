/**
 * Created by igi on 28.12.15.
 */
'use strict';
angular.module('greyscale.tables')
    .factory('greyscaleApplyWorkflowTemplatesTbl', function ($q,
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
            field: 'title',
            cellTemplate: '<a ng-click="ext.applyWorkflowTemplate(row)" title="{{\'COMMON.APPLY\'|translate}}"><i class="fa fa-download"></i></a>&nbsp;&nbsp;{{row.title}}',
            cellTemplateExtData: {
                applyWorkflowTemplate: _applyWorkflowTemplate,
            },
            show: true
        }];

        var _table = {
            title: tns + 'WORKFLOW_TEMPLATES',
            icon: 'fa-road',
            cols: _fields,
            classes: 'hidden-head',
            dataPromise: getData,
            dataFilter: {},
            add: {
                icon: 'fa-upload',
                title: 'COMMON.SAVE',
                tooltip: tns + 'SAVE_WORKFLOW_TEMPLATE',
                handler: _saveWorkflowTemplate
            }
        };

        function _saveWorkflowTemplate() {
            var action = 'adding';
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
            console.log('save');
        }

        function _applyWorkflowTemplate(row) {
            console.log('apply', row);
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
