/**
 * Created by igi on 18.12.15.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ModalFormCtrl', function ($scope, $uibModalInstance, recordData, recordForm) {
        recordData = recordData || {};

        $scope.model = angular.copy(recordData);

        $scope.view = recordForm;

        $scope.error = '';

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

        if ($scope.view.validationError) {
            var off = $scope.$watch(function(){
                return $scope.view.validationError($scope.model);
            }, function(error){
                $scope.view.error = error;
                if (!error) {
                    $scope.error = null;
                }
            });
            $scope.$on('$destroy', function(){
                off();
            });
        }

        $scope.save = function () {
            $scope.error = '';
            if ($scope.view.error) {
                $scope.error = $scope.view.error;
                return;
            }
            if ($scope.view.savePromise) {
                $scope.view.savePromise($scope.model)
                    .then(function(){
                        $uibModalInstance.close($scope.model)
                    })
                    .catch(function(error){
                        $scope.error = error;
                    });
            } else {
                $uibModalInstance.close($scope.model);
            }
        };
    });
