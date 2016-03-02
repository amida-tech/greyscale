'use strict';

angular.module('greyscaleApp')
.controller('ModalSendMessageCtrl', function($scope, user, data, greyscaleUtilsSrv, greyscaleProfileSrv, $uibModalInstance, greyscaleNotificationApi, Organization, greyscaleUserApi) {

    $scope.model = {
        user: user ? angular.copy(user) : null
    };

    if (!user) {
        $scope.model.users = [];
        _loadUsers();
    }

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.send = function () {
        if (!$scope.validForm()) {
            return;
        }
        var messageData = {
            body: $scope.model.message,
            userTo: parseInt($scope.model.user.id)
        };
        angular.extend(messageData, data||{});
        messageData.userFrom = undefined;

        greyscaleNotificationApi.send(messageData)
            .then(function () {
                $uibModalInstance.close();
            })
            .catch(function (err) {
                greyscaleUtilsSrv.errorMsg(err, 'Send Message Error');
            });
    };

    $scope.getUserOption = function(user){
        return user.firstName + ' ' + user.lastName + ' (' + user.email + ')';
    };

    $scope.validForm = function(){
        return $scope.model.user && $scope.model.message && $scope.model.message !== '';
    };

    function _loadUsers() {
        var orgFilter = {organizationId: Organization.id};
        greyscaleProfileSrv.getProfile()
            .then(function (profile) {
                greyscaleUserApi.list(orgFilter)
                    .then(function(users){
                        $scope.model.users = _.sortBy(_.filter(users, function(u){
                            return u.id !== profile.id;
                        }), 'roleID');
                        //$scope.model.user = $scope.model.users[0];
                    });
            });
    }

});
