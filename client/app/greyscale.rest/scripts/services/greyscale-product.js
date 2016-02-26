/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleProductApi', function (greyscaleRestSrv, $q) {
        function api() {
            return greyscaleRestSrv().one('products');
        }

        function _get(id, params) {
            return api().one(id + '').get(params);
        }

        function _add(product) {
            return api().customPOST(product);
        }

        function _upd(product) {
            return api().one(product.id + '').customPUT(product);
        }

        function _del(id) {
            return api().one(id + '').remove();
        }

        function _productUoasApi(productId) {
            return api().one(productId + '').one('uoa');
        }

        function _productTasksApi(productId) {
            return api().one(productId + '').one('tasks');
        }

        function _uoasList(productId) {
            return function (params) {
                return _productUoasApi(productId).get(params);
            };
        }

        function _tasksList(productId) {
            return function (params) {
                return _productTasksApi(productId).get(params)
                    .then(function (tasks) {
                        angular.forEach(tasks, function (task) {
                            task.userUsergroupId = task.userUsergroupId || 1;
                        });
                        return tasks;
                    });
            };
        }

        function _uoasAddBulk(productId) {
            return function (uoasIds) {
                return _productUoasApi(productId).customPOST(uoasIds);
            };
        }

        function _tasksListUpdate(productId) {
            return function (tasks) {
                return _productTasksApi(productId).customPUT(tasks);
            };
        }

        function _uoasDel(productId) {
            return function (uoaId) {
                return _productUoasApi(productId).one(uoaId + '').remove();
            };
        }

        function _tasksDel(productId) {
            return function (taskId) {
                return _productTasksApi(productId).one(taskId + '').remove();
            };
        }

        var _productApi = function (productId) {
            return {
                uoasList: _uoasList(productId),
                uoasAddBulk: _uoasAddBulk(productId),
                uoasDel: _uoasDel(productId),
                tasksList: _tasksList(productId),
                tasksListUpdate: _tasksListUpdate(productId),
                tasksDel: _tasksDel(productId)
            };
        };

        return {
            get: _get,
            add: _add,
            update: _upd,
            delete: _del,
            product: _productApi
        };
    });
