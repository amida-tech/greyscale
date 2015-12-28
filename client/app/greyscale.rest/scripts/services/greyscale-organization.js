/**
 * Created by igi on 23.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleOrganizationSrv', function (greyscaleRestSrv) {

        return {
            list: _list,
            get: _get,
            update: _update,
            delete: _delete
        };

        function api(){
            return greyscaleRestSrv().one('organizations');
        }

        function _list (param) {
            return api().get(param);
        }

        function _get (id) {
            return api().one(id).get();
        }

        function _update(org) {
            return api().one(org.id+'').customPUT(org);
        }

        function _delete (id) {
            return api().one(id + '').remove();
        }
    });
