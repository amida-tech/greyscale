/**
 * Created by igi on 21.01.16.
 */
'use strict';
angular.module('greyscale.rest')
    .service('greyscaleUserUoaApi', function (greyscaleRestSrv) {
        return {
            list: _list
        };

        function _api() {
            return greyscaleRestSrv().one('user-uoa');
        }

        function _list(params) {
            return _api().get(params);
        }
    });
