/**
 * Created by igi on 23.08.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('ModalDlgCtrl', function ($scope, $uibModalInstance, $sce, i18n, params) {
        params = params || {};
        params.message = $sce.trustAsHtml(i18n.translate(params.message, params));

        $scope.params = params || {};

        $scope.close = function () {
            $uibModalInstance.dismiss();
        };

        $scope.select = function (val) {
            $uibModalInstance.close(val);
        };
    });
