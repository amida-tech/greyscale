/**
 * Created by igi on 06.09.16.
 */
'use strict';
angular.module('greyscale.core')
    .factory('greyscaleErrorHandler', function (_, greyscaleGlobals, $log) {

        return {
            errorInterceptor: _errorInterceptor
        };

        function _errorInterceptor(response, deferred, handler) {
            $log.debug('error response', response);
            if (response.status !== 400) {

                return false; // error handled
            }

            return true; // error not handled
        }
    });
