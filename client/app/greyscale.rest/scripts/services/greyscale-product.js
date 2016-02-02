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

        function _uoasList(productId) {
            return function (params) {
                return _productUoasApi(productId).get(params)
                    .catch(function(){
                        return $q.when([{
                            id: 1,
                            shortName: 'pjbphjnjnj',
                            unitOfAnalysisType: 1,

                        }, {
                            id: 2,
                            shortName: 'iyfljnluygl',
                            unitOfAnalysisType: 1,

                        }, {
                            id: 3,
                            shortName: 'vgftyfiygh;l',
                            unitOfAnalysisType: 2,

                        }, {
                            id: 4,
                            shortName: 'nbvgfkljn;',
                            unitOfAnalysisType: 2,

                        }, {
                            id: 5,
                            shortName: 'bvcfdeer',
                            unitOfAnalysisType: 1,

                        }, {
                            id: 6,
                            shortName: 'wscgbjk',
                            unitOfAnalysisType: 3,

                        }, {
                            id: 7,
                            shortName: 'esedftgvf',
                            unitOfAnalysisType: 2,

                        }, {
                            id: 8,
                            shortName: 'tfwaq',
                            unitOfAnalysisType: 4,

                        }, {
                            id: 9,
                            shortName: 'ddddffre',
                            unitOfAnalysisType: 4,

                        }]);
                    });
            };
        }

        function _uoasAddBulk(productId) {
            return function (uoasIds) {
                return _productUoasApi(productId).customPOST(uoasIds);
            };
        }

        function _uoasDel(productId) {
            return function (uoaId) {
                return _productUoasApi(productId).one(uoaId + '').remove();
            };
        }

        var _productApi = function (productId) {
            return {
                uoasList: _uoasList(productId),
                uoasAddBulk: _uoasAddBulk(productId),
                uoasDel: _uoasDel(productId)
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
