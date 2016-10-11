/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleProductApi', function (greyscaleRestSrv, greyscaleUtilsSrv) {
        var _productApi = function (productId) {
            return {
                uoasList: _uoasList(productId),
                uoasAddBulk: _uoasAddBulk(productId),
                uoasDel: _uoasDel(productId),
                tasksList: _tasksList(productId),
                tasksListUpdate: _tasksListUpdate(productId),
                tasksDel: _tasksDel(productId),
                taskMove: _taskMove(productId),
                aggregate: _aggregate(productId),
                indexesList: _indexesList(productId),
                indexesListUpdate: _indexesListUpdate(productId),
                subindexesList: _subindexesList(productId),
                subindexesListUpdate: _subindexesListUpdate(productId),
                getTicket: _getTicket(productId)
            };
        };

        return {
            get: _get,
            getList: _getList,
            add: _add,
            update: _upd,
            delete: _del,
            product: _productApi,
            getDownloadDataLink: _getDownloadDataLink
        };

        function api() {
            return greyscaleRestSrv.api().one('products');
        }

        function _productUoasApi(productId) {
            return api().one(productId + '').one('uoa');
        }

        function _productTasksApi(productId) {
            return api().one(productId + '').one('tasks');
        }

        function _productIndexesApi(productId) {
            return api().one(productId + '').one('indexes');
        }

        function _productSubindexesApi(productId) {
            return api().one(productId + '').one('subindexes');
        }

        function _get(id, params) {
            return api().one(id + '').get(params).then(_plainResp);
        }

        function _getList(params) {
            return api().getList('', params).then(_plainResp);
        }

        function _add(product) {
            return api().customPOST(product).then(_plainResp);
        }

        function _upd(product) {
            return api().one(product.id + '').customPUT(product).then(_plainResp);
        }

        function _del(id) {
            return api().one(id + '').remove().then(_plainResp);
        }

        function _aggregate(productId) {
            return function () {
                return api().one(productId + '').one('aggregate').get().then(_plainResp);
            };
        }

        function _indexesList(productId) {
            return function () {
                return _productIndexesApi(productId).get().then(_plainResp);
            };
        }

        function _subindexesList(productId) {
            return function () {
                return _productSubindexesApi(productId).get().then(_plainResp);
            };
        }

        function _indexesListUpdate(productId) {
            return function (indexes) {
                return _productIndexesApi(productId).customPUT(indexes).then(_plainResp);
            };
        }

        function _subindexesListUpdate(productId) {
            return function (indexes) {
                return _productSubindexesApi(productId).customPUT(indexes).then(_plainResp);
            };
        }

        function _uoasList(productId) {
            return function (params) {
                return _productUoasApi(productId).get(params).then(_plainResp);
            };
        }

        function _tasksList(productId) {
            return function (params) {
                return _productTasksApi(productId).get(params)
                    .then(_plainResp)
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
                return _productUoasApi(productId).customPOST(uoasIds).then(_plainResp);
            };
        }

        function _tasksListUpdate(productId) {
            return function (tasks) {
                return _productTasksApi(productId).customPUT(tasks).then(_plainResp);
            };
        }

        function _uoasDel(productId) {
            return function (uoaId) {
                return _productUoasApi(productId).one(uoaId + '').remove().then(_plainResp);
            };
        }

        function _tasksDel(productId) {
            return function (taskId) {
                return _productTasksApi(productId).one(taskId + '').remove().then(_plainResp);
            };
        }

        function _taskMove(productId) {
            return function (uoaId, params) {
                return api().one(productId + '').one('move').one(uoaId + '').get(params).then(_plainResp);
            };
        }

        function _plainResp(resp) {
            return (resp && typeof resp.plain === 'function') ? resp.plain() : resp;
        }

        function _getTicket(productId) {
            return function () {
                return api().one(productId + '').one('export_ticket').get().then(_plainResp);
            };
        }

        function _getDownloadDataLink(ticket) {
            return greyscaleUtilsSrv.getApiBase() + '/products/' + ticket.ticket + '/export.csv';
        }
    });
