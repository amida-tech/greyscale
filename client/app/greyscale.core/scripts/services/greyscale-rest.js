/**
 * Created by igi on 16.11.15.
 */
"use strict";

angular.module('greyscale.core')
    .service('greyscaleRestSrv', function (Restangular, greyscaleProfileSrv) {
        return function (headers) {
            return Restangular.withConfig(function (RestangularConfigurer) {
                headers = headers || {};
                var token = greyscaleProfileSrv.token();
                if (token) {
                    angular.extend(headers, {token: token});
                }
                RestangularConfigurer.setDefaultHeaders(headers);
            });
        };
    });
