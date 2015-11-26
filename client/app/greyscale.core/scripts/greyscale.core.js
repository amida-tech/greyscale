/**
 * Created by igi on 10.11.15.
 */
angular.module('greyscale.core', ['restangular'])
    .config(function (RestangularProvider) {
        RestangularProvider.setBaseUrl("http://localhost:3005/v0.2");
        RestangularProvider.setDefaultHttpFields({
            cache: false,
            withCredentials: false
        });
    });
