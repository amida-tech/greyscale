/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleEntityTypeRoleApi', function (greyscaleRestSrv) {

        return {
            list: _list,
            add: _add,
            get: _get,
            delete: _del,
            update: _update
        };

        function _api() {
            return greyscaleRestSrv.api().one('essence_roles');
        }

        function _list(params) {
            return _api().get(params);
        }

        function _get(id) {
            return _list({
                id: id
            });
        }

        function _add(data) {
            return _api().customPOST(data);
        }

        function _update(rec) {
            return _api().one(rec.id + '').customPUT(rec);
        }

        function _del(id) {
            return _api().one(id + '').remove();
        }

    });
