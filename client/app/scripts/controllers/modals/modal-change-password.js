'use strict';

angular.module('greyscaleApp')
    .controller('ModalChangePasswordCtrl', function ($scope, user, data, $uibModalInstance, greyscaleUtilsSrv,
        greyscaleUserApi) {

        $scope.model = {
            user: user,
            form: {
                id: user.id
            }
        };

        $scope.close = function () {
            $uibModalInstance.dismiss();
        };

        $scope.save = function () {
            greyscaleUserApi.update($scope.model.form, data.realm)
                .then(function () {
                    $uibModalInstance.close();
                    greyscaleUtilsSrv.successMsg('USERS.CHANGE_PASSWORD_SUCCESS');
                })
                .catch(function (err) {
                    greyscaleUtilsSrv.apiErrorMessage(err, 'UPDATE', 'LOGIN.PASSWORD');
                });
        };
    });
