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

        function api(realm) {
            return greyscaleRestSrv({}, realm).one('organizations');
        }

        function _list(param, realm) {
            return api(realm).get(param);
        }

        function _add(org, realm) {
            return api(realm).customPOST(org);
        }

        function _get(id, realm) {
            return api(realm).one(id).get();
        }

        function _update(org, realm) {
            return api(realm).one(org.id + '').customPUT(org);
        }

        function _delete(id, realm) {
            return api(realm).one(id + '').remove();
        }

        function _products(id, realm) {
            return api(realm).one(id + '').one('products').get();
        }
    });
