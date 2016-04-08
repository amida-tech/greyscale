/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscale.rest', ['restangular', 'greyscale.core'])
    .config(function (greyscaleEnv, RestangularProvider, greyscaleGlobalsProvider, greyscaleRolesSrvProvider) {

        var realm = 'public';

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
        var greyscaleRolesSrv = greyscaleRolesSrvProvider.$get();
        greyscaleRolesSrv().then(greyscaleGlobalsProvider.initRoles);
    });
