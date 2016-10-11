/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscale.rest', ['restangular', 'greyscale.core'])
    .config(function (greyscaleEnv, RestangularProvider, greyscaleGlobalsProvider, greyscaleRolesSrvProvider,
        greyscaleErrorHandlerProvider, $cacheFactoryProvider) {

        var realm = 'public',
            greyscaleRolesSrv = greyscaleRolesSrvProvider.$get(),
            greyscaleErrorHandler = greyscaleErrorHandlerProvider.$get(),
            cacheFactory = $cacheFactoryProvider.$get(),
            cache = cacheFactory('http');

        RestangularProvider.setBaseUrl(
            (greyscaleEnv.apiProtocol || 'http') + '://' +
            greyscaleEnv.apiHostname +
            (greyscaleEnv.apiPort !== undefined ? ':' + greyscaleEnv.apiPort : '') + '/' +
            realm + '/' +
            greyscaleEnv.apiVersion
        );

        RestangularProvider.setDefaultHttpFields({
            cache: cache,
            withCredentials: false
        });

        RestangularProvider.setErrorInterceptor(greyscaleErrorHandler.errorInterceptor);
        RestangularProvider.setResponseInterceptor(function (response, operation) {
            if (operation === 'put' || operation === 'post' || operation === 'remove') {
                if (cache) {
                    cache.removeAll();
                }
            }
            return response;
        });

        greyscaleRolesSrv().then(greyscaleGlobalsProvider.initRoles);
    });
