/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscale.rest', ['restangular'])
    .config(function (greyscaleEnv,RestangularProvider) {
        RestangularProvider.setBaseUrl(greyscaleEnv.baseServerUrl);
        RestangularProvider.setDefaultHttpFields({
            cache: false,
            withCredentials: false
        });
    });
