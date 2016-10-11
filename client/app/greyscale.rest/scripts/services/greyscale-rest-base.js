/**
 * Created by igi on 28.06.16.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('GreyscaleRestBase', function (greyscaleRestSrv) {

        var GsRestBase = function () {};

        GsRestBase.prototype._prepareResp = function (resp) {
            if (resp && typeof resp.plain === 'function') {
                return resp.plain();
            } else {
                return resp;
            }
        };

        GsRestBase.prototype._api = function (realm) {
            return greyscaleRestSrv.api({}, realm);
        };

        return GsRestBase;
    });
