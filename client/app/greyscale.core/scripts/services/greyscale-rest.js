/**
 * Created by igi on 16.11.15.
 */
"use strict";

angular.module('greyscale.core')
    .service('greyscaleRestSrv', function (Restangular) {
        return function (headers) {
            return Restangular.withConfig(function (RestangularConfigurer) {
                RestangularConfigurer.setDefaultHeaders(headers);
            });
        };
    });
