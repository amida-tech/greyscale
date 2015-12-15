/**
 * Created by dseytlin on 29.11.15.
 *
 * @ngdoc function
 * @name greyscaleApp.controller:CountriesCtrl
 * @description
 * # CountriesCtrl
 * Controller of the greyscaleApp
 */

'use strict';

angular.module('greyscaleApp')
    .controller('CountriesCtrl', function ($scope, $state, greyscaleProfileSrv, greyscaleModalsSrv, greyscaleCountrySrv,
                                           $log, inform) {
        $scope.countries = [];

        greyscaleProfileSrv.getProfile()
            .then(greyscaleCountrySrv.countries)
            .then(function (list) {
                $scope.countries = list;
            });

        $scope.addCountry = function () {
            greyscaleModalsSrv.editCountry();
        };

        $scope.deleteCountry = function () {
            greyscaleCountrySrv.deleteCountry(this.country)
                .catch(function (err) {
                    $log.debug('`CountriesCtrl` - country delete error: ' + err);
                    inform.add('country delete error: ' + err);
                })
                .finally($state.reload);
        };
    });
