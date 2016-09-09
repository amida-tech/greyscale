/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleProductWorkflowApi', function (greyscaleRestSrv, $q) {
        return {
            get: _get,
            add: _add,
            update: _upd,
            workflow: _workflowApi
        };

        function api() {
            return greyscaleRestSrv.api().one('workflows');
        }

        function _prepareData(resp) {
            if (resp) {
                return resp.plain();
            } else {
                return resp;
            }
        }

        function _get(id, params) {
            return api().one(id + '').get(params).then(_prepareData);
        }

        function _add(workflow) {
            return api().customPOST(workflow).then(_prepareData);
        }

        function _upd(workflow) {
            return api().one(workflow.id + '').customPUT(workflow).then(_prepareData);
        }

        function _workflowStepsApi(workflowId) {
            return api().one(workflowId + '').one('steps');
        }

        function _stepsList(workflowId) {
            return function (params) {
                return _workflowStepsApi(workflowId).get(params)
                    .then(_prepareData)
                    .then(function (steps) {
                        angular.forEach(steps, function (step) {
                            step.usergroupId = step.usergroupId || [1, 2];
                        });

                        return steps;
                    });
            };
        }

        function _stepsListUpdate(workflowId) {
            return function (stepIds) {
                return _workflowStepsApi(workflowId).customPUT(stepIds).then(_prepareData);
            };
        }

        function _workflowApi(workflowId) {
            return {
                stepsList: _stepsList(workflowId),
                stepsListUpdate: _stepsListUpdate(workflowId)
            };
        }
    });
