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

        function _productWorkflowApi(productId) {
            return api().one(productId + '').one('workflow');
        }

        function _uoasList(productId) {
            return function (params) {
                return _productUoasApi(productId).get(params)
                    .catch(function () {
                        return $q.when([{
                            id: 1,
                            name: '2222'
                        }]);
                    });
            }
        }

        function _uoasAddBulk(productId) {
            return function (uoasIds) {
                return _productUoasApi(productId).customPOST(uoasIds);
            }
        }

        function _uoasDel(productId) {
            return function (uoaId) {
                return _productUoasApi(productId).one(uoaId + '').remove();
            }
        }

        function _workflowList(productId) {
            return function (params) {
                return _productWorkflowApi(productId).get(params)
                    .catch(function () {
                        return $q.when([{
                            id: 1,
                            name: '2222'
                        }]);
                    });
            }
        }

        function _workflowUpdate(productId) {
            return function (stepIds) {
                return _productUoasApi(productId).customPOST(stepIds);
            }
        }

        var _productApi = function (productId) {
            return {
                uoasList: _uoasList(productId),
                uoasAddBulk: _uoasAddBulk(productId),
                uoasDel: _uoasDel(productId),
                workflowList: _workflowList(productId),
                workflowUpdate: _workflowUpdate(productId)
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
