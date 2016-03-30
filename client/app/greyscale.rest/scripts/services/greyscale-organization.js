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
            products: _products,
            groups: _groups
        };

        function api(realm) {
            return greyscaleRestSrv({}, realm).one('organizations');
        }

        function _prepareData(resp) {
            if (resp) {
                return resp.plain();
            } else {
                return resp;
            }
        }

        function _list(param, realm) {
            return api(realm).get(param).then(_prepareData);
        }

        function _add(org, realm) {
            return api(realm).customPOST(org).then(_prepareData);
        }

        function _get(id, realm) {
            return api(realm).one(id).get().then(_prepareData);
        }

        function _update(org, realm) {
            return api(realm).one(org.id + '').customPUT(org).then(_prepareData);
        }

        function _delete(id, realm) {
            return api(realm).one(id + '').remove();
        }

        function _products(id, realm) {
            return api(realm).one(id + '', 'products').get().then(_prepareData);
        }

        function _groups(id, realm) {
            return api(realm).one(id + '', 'groups').get().then(_prepareData);
        }
    });
