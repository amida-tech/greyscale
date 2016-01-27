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
            return api().one(id + '').get(params);
        }

        function _add(workflow) {
            return api().customPOST(workflow);
        }

        function _upd(workflow) {
            return api().one(workflow.id + '').customPUT(workflow);
        }

        function _workflowStepsApi(workflowId) {
            return api().one(workflowId + '').one('steps');
        }

        function _stepsList(workflowId) {
            return function (params) {
                return _workflowStepsApi(workflowId).get(params);
            };
        }

        function _stepsListUpdate(workflowId) {
            return function (stepIds) {
                return _workflowStepsApi(workflowId).customPUT(stepIds);
            };
        }

        var _workflowApi = function (workflowId) {
            return {
                stepsList: _stepsList(workflowId),
                stepsListUpdate: _stepsListUpdate(workflowId)
            };
        };

        return {
            get: _get,
            add: _add,
            update: _upd,
            workflow: _workflowApi
        };
    });
