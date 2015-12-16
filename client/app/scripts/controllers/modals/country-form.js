/**
 * Created by igi on 15.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('CountryFormCtrl', function ($scope, $uibModalInstance, greyscaleCountrySrv, inform, data) {
        $scope.model = {
            'name': '',
            'alpha2': '',
            'alpha3': '',
            'nbr': ''
        };

        if (data) {
            angular.extend($scope.model,data);
        }

        $scope.close = function (res) {
            return $uibModalInstance.close(res);
        };

        $scope.add = function () {
            return greyscaleCountrySrv.addCountry($scope.model)
                .then($scope.close)
                .catch(function (err) {
                    inform.add(err, {type: 'danger'});
                })
                .finally();
        };
    });
