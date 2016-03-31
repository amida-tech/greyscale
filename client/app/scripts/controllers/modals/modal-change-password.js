'use strict';

angular.module('greyscaleApp')
.controller('ModalChangePasswordCtrl', function($scope, user, data, greyscaleUtilsSrv, greyscaleProfileSrv, $uibModalInstance, greyscaleUserApi, inform, i18n) {

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
                inform.add(i18n.translate('USERS.CHANGE_PASSWORD_SUCCESS'), {
                    type: 'success'
                });
            })
            .catch(function (err) {
                greyscaleUtilsSrv.errorMsg(err, 'Change Password Error');
            });
    };

});
