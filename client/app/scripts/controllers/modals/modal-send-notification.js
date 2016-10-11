'use strict';

angular.module('greyscaleApp')
    .controller('ModalSendNotificationCtrl',
        function ($scope, user, data, $uibModalInstance, greyscaleUtilsSrv, greyscaleNotificationApi) {

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
                        greyscaleUtilsSrv.successMsg('NOTIFICATIONS.SEND_SUCCESS');
                    })
                    .catch(function (err) {
                        greyscaleUtilsSrv.apiErrorMessage(err, 'SEND_MSG');
                    });
            };

            $scope.validForm = function () {
                return $scope.model.notification.body && $scope.model.notification.body !== '';
            };
        });
