/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProductWorkflowTbl', function (_, $q, greyscaleModalsSrv,
        greyscaleProductApi, greyscaleUtilsSrv, greyscaleRoleApi,
        greyscaleWorkflowStepsApi, greyscaleProductWorkflowApi, greyscaleGlobals) {

        var tns = 'PRODUCTS.WORKFLOW.STEPS.';

        var _dicts = {
            roles: []
        };

        var recDescr = [{
            field: 'title',
            show: true,
            title: tns + 'TITLE',
            dataRequired: true,
            dataFormat: 'text'
        }, {
            field: 'step.roleId',
            title: tns + 'ROLE',
            showDataInput: true,
            dataFormat: 'option',
            dataNoEmptyOption: true,
            dataSet: {
                keyField: 'id',
                valField: 'name',
                getData: getRoles
            }
        }, {
            field: 'step.writeToAnswers',
            title: tns + 'ANSWERS_ACCESS',
            showDataInput: true,
            dataFormat: 'option',
            dataNoEmptyOption: true,
            dataSet: {
                keyField: 'value',
                valField: 'name',
                getData: _getWriteToAnswersList
            }
        }, {
            field: 'step.startDate',
            title: tns + 'START_DATE',
            showDataInput: true,
            dataFormat: 'date'
        }, {
            field: 'step.endDate',
            title: tns + 'END_DATE',
            showDataInput: true,
            dataFormat: 'date'
        }, {
            show: true,
            multiselect: true,
            multiselectDisableOnUncheck: true
        }];

        var _table = {
            title: tns + 'PRODUCT_WORKFLOW_STEPS',
            icon: 'fa-fast-forward',
            pageLength: 10,
            cols: recDescr,
            dataPromise: _getData,
            multiselect: {},
            dataFilter: {}
        };

        function getRoles() {
            return _dicts.roles;
        }

        function _getWriteToAnswersList() {
            return greyscaleGlobals.writeToAnswersList;
        }

        function _getWorkflowId() {
            return _table.dataFilter.workflowId;
        }

        function _getData() {

            var workflowId = _getWorkflowId();
            var roleFilter = {
                isSystem: false
            };
            var req = {
                steps: _getWorkStepsPromise(workflowId),
                workflowSteps: greyscaleWorkflowStepsApi.list(),
                roles: greyscaleRoleApi.list(roleFilter)
            };

            return $q.all(req).then(function (promises) {
                _setTableMultiselect(promises.steps);
                _dicts.roles = promises.roles;
                return _getWorkflowStepsTableData(promises.workflowSteps, promises.steps);
            });
        }

        function _getWorkStepsPromise(workflowId) {
            var promise = $q.when([]);
            if (workflowId) {
                promise = greyscaleProductWorkflowApi.workflow(workflowId).stepsList();
            }
            return promise;
        }

        function _setTableMultiselect(steps) {
            _table.multiselect.setSelected(steps, 'stepId');
        }

        function _getWorkflowStepsTableData(allSteps, workSteps) {
            var stepsTableData = allSteps;
            angular.forEach(allSteps, function (step) {
                var workStep = _.find(workSteps, {
                    stepId: step.id
                });
                step.step = workStep || {
                    stepId: step.id,
                };
                step.step.writeToAnswers = !!step.step.writeToAnswers;
                step.step.taskAccessToResponses = !!step.step.taskAccessToResponses;
                step.step.taskAccessToDiscussions = !!step.step.taskAccessToDiscussions;
                step.step.taskBlindReviewer = !!step.step.taskBlindReviewer;
                step.step.workflowAccessToResponses = !!step.step.workflowAccessToResponses;
                step.step.workflowAccessToDiscussions = !!step.step.workflowAccessToDiscussions;
                step.step.workflowBlindReviewer = !!step.step.workflowBlindReviewer;
            });
            return stepsTableData;
        }

        return _table;
    });
