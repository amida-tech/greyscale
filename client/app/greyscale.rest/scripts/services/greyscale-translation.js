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
            if (body.mock) {
                return _api().one('mock').customPOST(body);
            } else {
                return _api().customPOST(body);
            }
        }

        function _edit(body) {
            if (body.essenceId && body.entityId && body.langId) {
                if (body.mock) {
                    return _api().one(body.essenceId + '', body.entityId + '').one(body.langId + '',
                        'mock').customPUT(body);
                } else {
                    return _api().one(body.essenceId + '', body.entityId + '').one(body.langId + '').customPUT(body);
                }
            } else {
                $q.reject('inconsistent translation body');
            }
        }

        function _del(body) {
            if (body.essenceId && body.entityId && body.langId) {
                if (body.mock) {
                    return _api().one(body.essenceId + '', body.entityId + '').one(body.langId + '', 'mock').remove();
                } else {
                    return _api().one(body.essenceId + '', body.entityId + '').one(body.langId + '').remove();
                }
            } else {
                $q.reject('inconsistent translation body');
            }
        }
    });
