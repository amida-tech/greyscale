'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleTaskApi', function (greyscaleRestSrv, $q) {
        return {
            myList: _myList,
            get: _getTask,
            add: _add,
            update: _update,
            del: _del,
            state: _state
        };

        function api() {
            return greyscaleRestSrv().one('tasks');
        }

        function _prepareResp(resp) {
            if (resp && typeof resp.plain === 'function') {
                return resp.plain();
            } else {
                return resp;
            }
        }

        function userAPI() {
            return greyscaleRestSrv().one('users');
        }

        function selfAPI() {
            return userAPI().one('self');
        }

        function myTasks() {
            return selfAPI().one('tasks');
        }

        function _myList(params) {
            return myTasks().get(params).then(_prepareResp);
        }

        function _del(taskId) {
            return api().one(taskId + '').remove().then(_prepareResp);
        }

        function _add(task) {
            return api().customPOST(task).then(_prepareResp);
        }

        function _update(taskId, task) {
            return api().one(taskId + '').customPUT(task).then(_prepareResp);
        }

        function _getTask(taskId) {
            return api().one(taskId + '').get().then(_prepareResp);
        }

        function _state(taskId, state) {
            if (state) {
                return api().one(taskId + '', '' + state)
                    .get()
                    .then(_prepareResp);
            } else {
                return $q.reject('NO_TASK_STATE');
            }
        }
    });
