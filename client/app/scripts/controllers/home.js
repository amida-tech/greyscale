/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('HomeCtrl', function ($scope, greyscaleNotificationApi, greyscaleProfileSrv) {

        $scope.model = {};

        greyscaleProfileSrv.getProfile().then(_getUnreadNotifications);

        function _getUnreadNotifications(profile) {
            var params = {
                userTo: profile.id,
                read: false
            };
            greyscaleNotificationApi.list(params)
                .then(function (messages) {
                    $scope.model.unreadMesages = messages.length;
                });
        }

    });
