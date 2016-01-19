/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleProductSrv', function (greyscaleRestSrv) {
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

        return {
            get: _get,
            add: _add,
            update: _upd,
            delete: _del
        };
    });
