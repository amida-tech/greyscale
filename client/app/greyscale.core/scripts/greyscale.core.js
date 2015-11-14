/**
 * Created by igi on 10.11.15.
 */
angular.module('greyscale.core',['restangular'])
    .config(function(RestangularProvider){
        RestangularProvider.setBaseUrl("http://indaba.ntrlab.ru:83/v0.2");
    });
