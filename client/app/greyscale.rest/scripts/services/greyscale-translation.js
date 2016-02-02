/**
 * Created by igi on 26.01.16.
 */
angular.module('greyscale.rest')
    .factory('greyscaleTranslationApi', function (greyscaleRestSrv, $q) {
        return {
            list: _list,
            listByEntityType: _listByEntityType,
            listByEntity: _listByEntityId,
            add: _add,
            edit: _edit,
            delete: _del
        };

        function _api() {
            return greyscaleRestSrv().one('translations');
        }

        function _list(params) {
            return _api().get(params);
        }

        function _listByEntityType(entityTypeId, params) {
            return _api().one(entityTypeId + '').get(params);
        }

        function _listByEntityId(entityTypeId, entityId, params) {
            return _api().one(entityTypeId + '', entityId + '').get(params);
        }

        function _add(body) {
            var req = _api();
            if (body.mock) {
                req.one('mock');
            }
            return req.customPOST(body);
        }

        function _edit(body) {
            var res;
            if (body.essenceId && body.entityId && body.langId && body.field) {
                var req = _api().one(body.essenceId + '', body.entityId + '').one(body.field + '', body.langId + '');
                if (body.mock) {
                    req.one('mock');
                }
                res = req.customPUT(body);
            } else {
                res = $q.reject('inconsistent translation body');
            }
            return res;
        }

        function _del(body) {
            var res;
            if (body.essenceId && body.entityId && body.langId && body.field) {
                var req = _api().one(body.essenceId + '', body.entityId + '').one(body.field + '', body.langId + '');
                if (body.mock) {
                    req.one('mock');
                }
                res = req.remove();
            } else {
                res = $q.reject('inconsistent translation body');
            }
            return res;
        }
    });
