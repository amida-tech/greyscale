/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleProductWorkflowApi', function (greyscaleRestSrv, $q) {
        function api() {
            return greyscaleRestSrv().one('workflows');
        }

        function _get(id, params) {
            return api().one(id + '').get(params).then(_response);
        }

        function _add(workflow) {
            return api().customPOST(workflow).then(_response);
        }

        function _upd(workflow) {
            return api().one(workflow.id + '').customPUT(workflow).then(_response);
        }

        function _workflowStepsApi(workflowId) {
            return api().one(workflowId + '').one('steps');
        }

        function _stepsList(workflowId) {
            return function (params) {
                return _workflowStepsApi(workflowId)
                .get(params).then(_response)
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
                return _workflowStepsApi(workflowId).customPUT(stepIds).then(_response);
            };
        }

        var _workflowApi = function (workflowId) {
            return {
                stepsList: _stepsList(workflowId),
                stepsListUpdate: _stepsListUpdate(workflowId)
            };
        };

        function _response(data) {
            if (data && typeof data.plain === 'function') {
                return data.plain();
            } else {
                return data;
            }
        }

        return {
            get: _get,
            add: _add,
            update: _upd,
            workflow: _workflowApi
        };
    });
