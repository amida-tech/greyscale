/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ModalFormCtrl', function ($scope, $uibModalInstance, recordData, recordForm) {
        $scope.model = angular.copy(recordData);

        $scope.view = recordForm;

        $scope.close = function () {
            $uibModalInstance.dismiss();
        };

        $scope.save = function () {

            $uibModalInstance.close($scope.model);
        };
    });
