/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscale.rest', ['restangular', 'greyscale.core'])
    .config(function (greyscaleEnv, RestangularProvider, greyscaleGlobalsProvider, greyscaleRoleApiProvider) {
        RestangularProvider.setBaseUrl(
            greyscaleEnv.apiProtocol + '://' +
            greyscaleEnv.apiHostname + ':' +
            greyscaleEnv.apiPort + '/' +
            greyscaleEnv.apiRealm + '/' +
            greyscaleEnv.apiVersion
        );
        RestangularProvider.setDefaultHttpFields({
            cache: false,
            withCredentials: false
        });
        var greyscaleRoleApi = greyscaleRoleApiProvider.$get();
        greyscaleRoleApi.list().then(greyscaleGlobalsProvider.initRoles);
    });
