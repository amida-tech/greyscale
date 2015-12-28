/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscale.rest')
    .factory('greyscaleEntityTypeSrv', function (greyscaleRestSrv) {

        var _api = function () {
            return greyscaleRestSrv().one('essences');
        };

        var _list = function (params) {
            return _api().get(params);
        };

        var _add = function (data) {
            return _api().customPOST(data);
        };

        return {
            list: _list,
            add: _add
        };
    });
