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
            addMocked: _addMocked,
            delMocked: _delMocked
        };

        function _resp(respObj) {
            return respObj.plain();
        }

        function _api() {
            return greyscaleRestSrv().one('user-uoa');
        }

        function _list(params) {
            return _api().get(params).then(_resp);
        }

        function _add(list) {
            return _api().customPOST(list);
        }

        function _del(list) {
            return _api().remove(list);
        }

        function _addMocked(list) {
            return _api().one('mock').customPOST(list);
        }

        function _delMocked(list) {
            return _api().one('mock').remove(list);
        }
    });
