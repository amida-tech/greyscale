/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ModalFormCtrl', function ($scope, $uibModalInstance, recordData, recordForm) {
        recordData = recordData || {};

        $scope.model = angular.copy(recordData);

        $scope.view = recordForm;

        $scope.showItem = function(item, model){
            if (typeof item.showFormField === 'function') {
                return item.showFormField(model);
            } else {
                return item.showFormField === undefined || item.showFormField;
            }
        };

        $scope.close = function () {
            $uibModalInstance.dismiss();
        };

        $scope.save = function () {
            $uibModalInstance.close($scope.model);
        };
    });
