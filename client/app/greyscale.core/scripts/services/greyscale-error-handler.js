/**
 * Created by igi on 06.09.16.
 */
'use strict';

angular.module('greyscale.core')
    .factory('greyscaleErrorHandler', function (greyscaleUtilsSrv, $log) {
        var i18nPrefix = 'API_ERRORS.';

        return {
            errorInterceptor: _errorInterceptor
        };

        function _errorInterceptor(response, deferred, handler) {
            if (!response.data || !response.data.message) {
                $log.debug(response);
                greyscaleUtilsSrv.errorMsg(i18nPrefix + response.status);
            }
            return true; //error not handled
        }
    });
