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
            cache = $cacheFactoryProvider.$get();

        RestangularProvider.setBaseUrl(
            (greyscaleEnv.apiProtocol || 'http') + '://' +
            greyscaleEnv.apiHostname +
            (greyscaleEnv.apiPort !== undefined ? ':' + greyscaleEnv.apiPort : '') + '/' +
            realm + '/' +
            greyscaleEnv.apiVersion
        );

        RestangularProvider.setDefaultHttpFields({
            cache: false,
            withCredentials: false
        });

        RestangularProvider.setErrorInterceptor(greyscaleErrorHandler.errorInterceptor);
        RestangularProvider.setResponseInterceptor(function(response, operation) {
            if (operation === 'put' || operation === 'post' || operation === 'remove') {
                console.log('reset client cache');
                cache('http').removeAll();
            }
            return response;
        });

        greyscaleRolesSrv().then(greyscaleGlobalsProvider.initRoles);
    });
