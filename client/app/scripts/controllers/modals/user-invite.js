/**
 * Created by igi on 09.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('UserInviteCtrl', function ($scope, $uibModalInstance, inform) {
        $scope.model = {
            'firstName': '',
            'lastName': '',
            'email': ''
        };
        $scope.close = function () {
            $uibModalInstance.close();
        };
        $scope.invite = function () {
            greyscaleAuthSrv.inviteUser($scope.model)
                .then(function () {
                    inform.add('User invited', {type: 'success'});
                })
                .catch(function (err) {
                    inform.add(err.data.message);
                })
                .finally($scope.close);
        }
    });
