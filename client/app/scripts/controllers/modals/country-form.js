/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('CountryFormCtrl', function ($scope, $state, $uibModalInstance, inform, data) {
        $scope.model = {
            'name': '',
            'alpha2': '',
            'alpha3': '',
            'nbr': ''
        };

        if (data) {
            angular.extend($scope.model,data);
        }

        $scope.close = function () {
            $uibModalInstance.close();
            $state.reload();
        };

        $scope.add = function () {
            greyscaleCountrySrv.addCountry($scope.model)
                .catch(function (err) {
                    inform.add(err, {type: 'danger'});
                })
                .finally($scope.close);
        };
    });
