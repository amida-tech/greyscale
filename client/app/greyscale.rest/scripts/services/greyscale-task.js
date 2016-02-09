'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleTaskApi', function (greyscaleRestSrv, $q) {

        function api() {
            return greyscaleRestSrv().one('tasks');
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
            return myTasks().get(params);
        }

        function _del(taskId) {
            return api().one(taskId + '').remove();
        }

        function _add(task) {
            return api().customPOST(task);
        }

        function _update(taskId, task) {
            return api().one(taskId + '').customPUT(task);
        }

        return {
            myList: _myList,
            add: _add,
            update: _update,
            del: _del
        };
    });
