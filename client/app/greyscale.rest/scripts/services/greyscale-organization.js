/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleOrganizationApi', function (greyscaleRestSrv) {

        return {
            list: _list,
            get: _get,
            add: _add,
            update: _update,
            delete: _delete,
            products: _products
        };

        function api() {
            return greyscaleRestSrv().one('organizations');
        }

        function _list(param) {
            return api().get(param);
        }

        function _add(org) {
            return api().customPOST(org);
        }

        function _get(id) {
            return api().one(id).get();
        }

        function _update(org) {
            return api().one(org.id + '').customPUT(org);
        }

        function _delete(id) {
            return api().one(id + '').remove();
        }

        function _products(id) {
            return api().one(id + '').one('products').get()
        }
    });
