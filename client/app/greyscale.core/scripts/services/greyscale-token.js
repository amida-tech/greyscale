/**
 * Created by igi on 16.11.15.
 */
"use strict";

angular.module('greyscale.core')
    .factory('greyscaleTokenSrv', function (Restangular,$log) {
        return Restangular.withConfig(function (RestangularConfigurer, greyscaleProfileSrv) {
            $log.debug(greyscaleProfileSrv);
            if (greyscaleProfileSrv) {
                RestangularConfigurer.setDefaultHeaders({token: greyscaleProfileSrv.token()});
            }
        });
    });
