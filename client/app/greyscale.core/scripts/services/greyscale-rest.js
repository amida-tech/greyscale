/**
 * Created by igi on 16.11.15.
 */
'use strict';

angular.module('greyscale.core')
    .factory('greyscaleRestSrv', function (Restangular, greyscaleTokenSrv, $rootScope, greyscaleEnv,
        greyscaleRealmSrv, greyscaleUtilsSrv, $q) {

        return {
            api: _api,
            errHandler: _errHandler,
            postProc: _postProc
        };

        function _api(headers, realm) {
            headers = headers || {};

            var aHeaders = {
                'Content-Type': 'application/json',
                'Accept-Language': $rootScope.currentLocale
            };

            angular.extend(aHeaders, headers);

            return Restangular.withConfig(function (RestangularConfigurer) {
                var token = greyscaleTokenSrv();
                var _realm = realm || greyscaleRealmSrv.current();

                if (token) {
                    angular.extend(aHeaders, {
                        token: token
                    });
                }

                if (_realm) {
                    RestangularConfigurer.setBaseUrl(
                        (greyscaleEnv.apiProtocol || 'http') + '://' +
                        greyscaleEnv.apiHostname +
                        (greyscaleEnv.apiPort !== undefined ? ':' + greyscaleEnv.apiPort : '') + '/' +
                        _realm + '/' +
                        greyscaleEnv.apiVersion
                    );
                }

                RestangularConfigurer.setDefaultHeaders(aHeaders);
            });
        }

        function _errHandler(err, action, entry) {
            greyscaleUtilsSrv.apiErrorMessage(err, action, entry);
            return $q.reject(err);
        }

        function _postProc(data) {
            if (data && typeof data.plain === 'function') {
                data = data.plain();
            }
            return data;
        }
    });
