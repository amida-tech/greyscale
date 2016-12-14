'use strict';

angular.module('greyscaleApp')
    .controller('ModalSendNotificationCtrl',
        function ($scope, users, data, $uibModalInstance, greyscaleUtilsSrv, greyscaleNotificationApi, greyscaleProfileSrv, $q) {
            $scope.model = {
                user: null,
                users: users,
                notification: {
                    notifyLevel: 2
                },
                copyMe: false,
                optional: data && data.optional
            }
            if (users && users.length === 1) { $scope.model.user = users[0]; }
            if (data && data.intro) { $scope.model.intro = data.intro; }

            $scope.close = function () {
                $uibModalInstance.dismiss();
            };

            function _sendNotification(user) {
                return greyscaleNotificationApi.send(angular.extend({
                    userTo: user.id
                }, $scope.model.notification));
            }

            $scope.send = function () {
                if (!$scope.validForm()) {
                    return;
                }

                var notifications = {}
                // send notification to all destination users
                notifications.user = function () {
                    return $q.all($scope.model.users.map(_sendNotification));
                };
                // send copy of notification to current user
                if ($scope.model.copyMe) {
                    notifications.me = function () {
                        return greyscaleProfileSrv.getProfile().then(_sendNotification);
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
