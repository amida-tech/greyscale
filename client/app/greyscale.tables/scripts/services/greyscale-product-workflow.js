/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscale.tables')
    .factory('greyscaleProductWorkflowTbl', function (_, $q, greyscaleModalsSrv,
        greyscaleProductApi, greyscaleUtilsSrv, greyscaleRoleApi, greyscaleWorkflowStepsApi, greyscaleProductWorkflowApi) {

        var _dicts = {
            roles: []
        };

        var recDescr = [{
            field: 'title',
            show: true,
            title: 'Title',
            dataRequired: true,
            dataFormat: 'text'
        }, {
            field: 'step.roleId',
            title: 'Role',
            showDataInput: true,
            dataFormat: 'option',
            dataSet: {
                keyField: 'id',
                valField: 'name',
                getData: getRoles
            }
        }, {
            field: 'step.startDate',
            title: 'Start Date',
            showDataInput: true,
            dataFormat: 'date'
        }, {
            field: 'step.endDate',
            title: 'End Date',
            showDataInput: true,
            dataFormat: 'date'
        }, {
            show: true,
            multiselect: true,
            multiselectDisableOnUncheck: true
        }];

        var _table = {
            title: 'Product Workflow Steps',
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
                step.step = workStep || {};
            });
            return stepsTableData;
        }

        return _table;
    });
