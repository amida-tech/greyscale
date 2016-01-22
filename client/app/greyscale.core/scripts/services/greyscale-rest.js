/**
 * Created by igi on 16.11.15.
 */
'use strict';

angular.module('greyscale.core')
    .service('greyscaleRestSrv', function (Restangular, greyscaleTokenSrv) {
        return function (headers) {
            headers = headers || {};
            var aHeaders = {
                'Content-Type': 'application/json'
            };
            angular.extend(aHeaders, headers);

            return Restangular.withConfig(function (RestangularConfigurer) {
                var token = greyscaleTokenSrv();
                if (token) {
                    angular.extend(aHeaders, {
                        token: token
                    });
                }
                RestangularConfigurer.setDefaultHeaders(aHeaders);
            });
        };
    });
