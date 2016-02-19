'use strict';
angular.module('greyscaleApp')
    .controller('ModalConfirmCtrl', function ($scope, $uibModalInstance, params, i18n, $sce) {
        params = params || {};

        params.message = $sce.trustAsHtml(i18n.translate(params.message, params));

        $scope.params = params;

        $scope.close = function () {
            $uibModalInstance.dismiss();
        };

        $scope.confirm = function () {
            $uibModalInstance.close($scope.model);
        };
    });
