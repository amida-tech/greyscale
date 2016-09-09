/**
 * Created by igi on 06.09.16.
 */
'use strict';

angular.module('greyscale.core')
    .factory('greyscaleErrorHandler', function (i18n, i18nData) {
        var _errors = i18nData.translations.API_ERRORS || {};

        return {
            errorInterceptor: _errorInterceptor
        };

        function _errorInterceptor(response, deferred, handler) {
            if (response.status > 399) {
                // set error message for standard errors, not from API
                if (!response.data || !response.data.message) {
                    response.data = angular.extend(response.data || {}, {
                        message: response.status
                    });
                }
                //try to translate them so catch handlers may just display it
                if (_errors[response.data.message]) {
                    response.data.message = i18n.translate('API_ERRORS.' + response.data.message);
                }
            }
            return true; //error not handled
        }
    });
