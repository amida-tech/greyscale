/**
 * Created by sbabushkin on 26.11.15.
 */
"use strict";

var module = angular.module('greyscaleApp');


module.controller('ActivateCtrl', function ($scope, greyscaleAuthSrv, $stateParams, inform, $state) {
    greyscaleAuthSrv.checkActivationToken($stateParams.token)
    .then(function(resp){
        $scope.user = resp;
    },function(err){
        inform.add(err.data.message, {type: 'danger'});
        $state.go('login');
    })
});

module.controller('ProfileCtrl', function ($scope, greyscaleAccessSrv, greyscaleAuthSrv, $stateParams, inform, $state, $uibModal) {

    $scope.org = {
        loaded  : false,
        name    : '',
        address : '',
        url     : ''
    };

    greyscaleAcessSrv.user()
    .then(function(resp){
        $scope.user = resp;
        if(resp.roleID == 2){ //client
            greyscaleAuthSrv.getOrg()
            .then(function(resp){
                $scope.org = resp;
                $scope.org.loaded = true;
            },function(err){
                inform.add(err.data.message, {type: 'danger'});
            });
        }
    },function(err){
        inform.add(err.data.message, {type: 'danger'});
    });


    $scope.editProfile = function () {
        inform.add('editProfile', {type: 'success'});
    }

    $scope.editOrg = function () {
        var modalInstance = $uibModal.open({
            templateUrl: "views/modals/organization.html",
            controller: 'OrgFormCtrl',
            size: 'md',
            windowClass: 'modal fade in',
            resolve: {
                org : function(){
                    return $scope.org;
                }
            }
        });
    }
});

module.controller('OrgFormCtrl', function($scope, $modalInstance, greyscaleAuthSrv, inform, org){
    $scope.model = angular.copy(org);
    $scope.close = function(){
        $modalInstance.close();
    }
    $scope.update = function(){
        greyscaleAuthSrv.orgSave($scope.model).then(function(resp){
            org.isActive = true;
            org.name     = $scope.model.name;
            org.address  = $scope.model.address;
            org.url      = $scope.model.url;
            $scope.close();
        },function(err){
            inform.add(err.data.message);
        });
    }
});

