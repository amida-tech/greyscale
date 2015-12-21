/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscale.rest')
    .service('greyscaleEntryTypeSrv', function (greysaleRestSrv) {

        var _api = function () {
            return greysaleRestSrv().one('essences');
        };

        return {
            list: function () {
                return _api().get();
            }
        };
    });
