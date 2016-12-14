'use strict';

angular.module('greyscaleApp')
    .controller('ModalSendNotificationCtrl',
        function ($scope, user, data, $uibModalInstance, greyscaleUtilsSrv, greyscaleNotificationApi, greyscaleProfileSrv, $q) {

            $scope.model = {
                user: user,
                notification: {
                    userTo: user.id,
                    notifyLevel: 2
                },
                copyMe: false
            };

            $scope.close = function () {
                $uibModalInstance.dismiss();
            };

            $scope.send = function () {
                if (!$scope.validForm()) {
                    return;
                }

                var notifications = {}
                // send notification to destination user
                notifications.user = function () {
                    return greyscaleNotificationApi.send($scope.model.notification);
                };
                // send copy of notification to current user
                if ($scope.model.copyMe) {
                    notifications.me = function () {
                        return greyscaleProfileSrv.getProfile().then(function (profile) {
                            return greyscaleNotificationApi.send(angular.extend({
                                userTo: profile.id
                            }, $scope.model.notification));
                        });
                    };
                }

                return $q.all(notifications)
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
