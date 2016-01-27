/**
 * Created by igi on 26.01.16.
 */
angular.module('greyscale.rest')
    .factory('greyscaleTanslationApi', function (greyscaleRestSrv, $q) {
        return {
            list: _list,
            add: _add,
            edit: _edit
        };

        function _api() {
            return greyscaleRestSrv.one('translations');
        }

        function _list(params) {
            return _api().get(params);
        }

        function _add(body) {
            return _api().customPOST(body);
        }

        function _edit(body) {
            if (body.essenceId && body.entityId && body.langId) {
                return _api().one(body.essenceId + '', body.entityId + '').one(body.langId + '').customPUT(body);
            } else {
                $q.reject('inconsistent translate body');
            }
        }
    });
