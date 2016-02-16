/**
 * Created by igi on 21.01.16.
 */
'use strict';
angular.module('greyscale.rest')
    .service('greyscaleUserUoaApi', function (greyscaleRestSrv) {
        return {
            list: _list,
            add: _add,
            del: _del,
            addOne: _addOne,
            delOne: _delOne,
            addMocked: _addMocked,
            delMocked: _delMocked
        };

        function _resp(respObj) {
            return respObj.plain();
        }

        function _api(userId) {
            return greyscaleRestSrv().one('users', userId+'').one('uoa');
        }

        function _list(userId, params) {
            return _api(userId).get(params).then(_resp);
        }

        function _add(userId, list) {
            return _api(userId).customPOST(list);
        }
        function _addOne(userId, uoaId) {
            return _api(userId).one(uoaId +'').customPOST({});
        }

        function _del(userId, list) {
            return _api(userId).remove(list);
        }

        function _delOne(userId, ouaId) {
            return _api(userId).one(uoaId+'').remove(list);
        }

        function _addMocked(list) {
            return _api().one('mock').customPOST(list);
        }

        function _delMocked(list) {
            return _api().one('mock').remove(list);
        }
    });
