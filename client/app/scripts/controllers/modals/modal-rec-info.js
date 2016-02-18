/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ModalRecInfoCtrl', function ($scope, $uibModalInstance, recordData, recordForm) {
        recordData = recordData || {};

        $scope.model = angular.copy(recordData);

        $scope.view = angular.copy(recordForm);
        angular.forEach($scope.view.cols, function (col) {
            col.dataReadOnly = 'both';
        });

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

    });
