/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscale.rest', ['restangular', 'greyscale.core'])
    .config(function (greyscaleEnv, RestangularProvider, greyscaleGlobalsProvider, greyscaleRoleApiProvider) {

        var domain = window.location.hostname.split('.');
        var realm = 'public';
        var baseLength = 'dev-mt'.indexOf(greyscaleEnv.name) !== -1? 4: 3;

        if (domain[0] === 'www') {
            domain.splice(0, 1);
        }

        if (domain.length >= baseLength) {
            realm = domain[0];
        }

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
        var greyscaleRoleApi = greyscaleRoleApiProvider.$get();
        greyscaleRoleApi.list().then(greyscaleGlobalsProvider.initRoles);
    });
