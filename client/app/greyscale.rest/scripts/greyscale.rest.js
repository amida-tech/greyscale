/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscale.rest', ['restangular', 'greyscale.core'])
    .config(function (greyscaleEnv, RestangularProvider, greyscaleGlobalsProvider, greyscaleRoleApiProvider) {

        var host = [greyscaleEnv.apiHostname, greyscaleEnv.apiPort].join(':');
        var path = [greyscaleEnv.apiRealm, greyscaleEnv.apiVersion].join('/');

        RestangularProvider.setBaseUrl((greyscaleEnv.apiProtocol || 'http') + '://' + host + '/' + path);
        RestangularProvider.setDefaultHttpFields({
            cache: false,
            withCredentials: false
        });
        var greyscaleRoleApi = greyscaleRoleApiProvider.$get();
        greyscaleRoleApi.list().then(greyscaleGlobalsProvider.initRoles);
    });
