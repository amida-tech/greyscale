/**
 * Created by dseytlin on 17.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('UoaTypeFormCtrl', function ($scope, $uibModalInstance, greyscaleUoaTypeSrv, inform, data) {
        $scope.model = {
            'name': '',
            'description': '',
            'langId': ''
        };

        $scope.title = 'Add new `Unit of Analysis Type`';
        $scope.okButton = 'Add';
        var add = true;
        if (data) {
            angular.extend($scope.model,data);
            $scope.title = 'Edit `Unit of Analysis Type`';
            $scope.okButton = 'Save';
            add = false;
        }

        $scope.close = function (res) {
            return $uibModalInstance.close(res);
        };

        $scope.ok = function () {
            return greyscaleUoaTypeSrv.saveUnitOfAnalysisType($scope.model, add)
                .then($scope.close)
                .catch(function (err) {
                    inform.add(err, {type: 'danger'});
                })
                .finally();
        };
    });
