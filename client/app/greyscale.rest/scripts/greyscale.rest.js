/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscale.rest', ['restangular', 'greyscale.core'])
    .config(function (greyscaleEnv, RestangularProvider, greyscaleGlobalsProvider, greyscaleRolesSrvProvider,
        greyscaleErrorHandlerProvider) {

        var realm = 'public',
            greyscaleRolesSrv = greyscaleRolesSrvProvider.$get(),
            greyscaleErrorHandler = greyscaleErrorHandlerProvider.$get();

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

        greyscaleRolesSrv().then(greyscaleGlobalsProvider.initRoles);
    });
