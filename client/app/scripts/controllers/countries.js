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
    .controller('CountriesCtrl', function ($state, $scope, greyscaleCountrySrv, $uibModal) {
        console.log('Controller `CountriesCtrl` started');
        $scope.countries = [];
        greyscaleCountrySrv.countries().then(function (list) {
            $scope.countries = list;
        });
        $scope.addCountry = function () {
            $uibModal.open({
                templateUrl: 'views/modals/country-add.html',
                controller: 'CountryAddCtrl',
                size: 'md',
                windowClass: 'modal fade in'
            });
        };
        $scope.deleteCountry = function () {
            greyscaleCountrySrv.deleteCountry(this.country).then(function () {
                console.log('`CountriesCtrl` - country deleted successfully');
                $state.reload();
            }, function (err) {
                console.log('`CountriesCtrl` - country delete error: ' + err);
                window.alert(err); //TODO
            });
        };
    })
    .controller('CountryAddCtrl', function ($state, $scope, $uibModalInstance, greyscaleCountrySrv) {
        console.log('Controller `CountryAddCtrl` started');
        $scope.model = {
            'name': '',
            'alpha2': '',
            'alpha3': '',
            'nbr': ''
        };
        $scope.close = function () {
            $uibModalInstance.close();
            $state.reload();
        };
        $scope.add = function () {
            greyscaleCountrySrv.addCountry($scope.model).then(function () {
                console.log('`CountryAddCtrl` - country added successfully');
                $scope.close();
            }, function (err) {
                console.log('`CountryAddCtrl` - country add error: ' + err);
                window.alert(err); //TODO
            });
        };
    });
