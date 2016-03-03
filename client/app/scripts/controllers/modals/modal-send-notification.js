'use strict';

angular.module('greyscaleApp')
.controller('ModalSendNotificationCtrl', function($scope, user, data, greyscaleUtilsSrv, greyscaleProfileSrv, $uibModalInstance, greyscaleNotificationApi, inform, i18n) {

    $scope.model = {
        user: user,
        notification: {
            userTo: user.id,
            notifyLevel: 2
        }
    };

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.send = function () {
        if (!$scope.validForm()) {
            return;
        }
        greyscaleNotificationApi.send($scope.model.notification)
            .then(function () {
                $uibModalInstance.close();
                inform.add(i18n.translate('NOTIFICATIONS.SEND_SUCCESS'), {
                    type: 'success'
                });
            })
            .catch(function (err) {
                greyscaleUtilsSrv.errorMsg(err, 'Send Message Error');
            });
    };

    $scope.validForm = function(){
        return $scope.model.notification.body && $scope.model.notification.body !== '';
    };

});
