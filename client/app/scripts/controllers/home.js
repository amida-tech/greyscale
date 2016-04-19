/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('HomeCtrl', function ($scope, greyscaleNotificationApi, greyscaleProfileSrv, greyscaleGlobals, Organization) {

        $scope.model = {};

        var _realm;
        greyscaleProfileSrv.getProfile()
            .then(function(profile){
                _realm = greyscaleProfileSrv.isSuperAdmin() ? greyscaleGlobals.adminSchema : Organization.realm;
                return profile;
            })
            .then(_getUnreadNotifications);

        function _getUnreadNotifications(profile) {

            var params = {
                userTo: profile.id,
                read: false
            };
            greyscaleNotificationApi.list(params, _realm)
                .then(function (messages) {
                    $scope.model.unreadMesages = messages.length;
                });
        }

    });
