/**
 * Created by sbabushkin on 26.11.15.
 */
"use strict";

var module = angular.module('greyscaleApp');


module.controller('ClientsCtrl', function ($state, $scope, greyscaleAuthSrv, $modal, inform) {
    console.log('ClientsCtrl');
    $scope.clients = [];
    $scope.roles   = [];
    greyscaleAuthSrv.roles().then(function(roles){
        $scope.roles = roles;
    });
    greyscaleAuthSrv.clients().then(function(list){
        $scope.clients = list;
    });
    $scope.inviteForm = function() {
        var modalInstance = $modal.open({
            templateUrl: "views/modals/client-invite.html",
            controller: 'ClientInviteCtrl',
            size: 'md',
            windowClass: 'modal fade in',
        });
    }
});

module.controller('ClientInviteCtrl', function ($scope, $modalInstance, greyscaleAuthSrv, inform) {
    $scope.model = {
        'firstName' : '',
        'lastName' : '',
        'email' : ''
    };
    $scope.close = function(){
        $modalInstance.close();
    }
    $scope.invite = function(){
        greyscaleAuthSrv.invite($scope.model).then(function(){
            $scope.close();
            inform.add('User invited', {type : 'success'});
        },function(err){
            inform.add(err.data.message);
        });
    }
});

module.controller('ActivateCtrl', function ($scope, greyscaleAuthSrv, $stateParams, inform, $state) {
    greyscaleAuthSrv.checkActivationToken($stateParams.token)
    .then(function(resp){
        $scope.user = resp;
    },function(err){
        inform.add(err.data.message, {type: 'danger'});
        $state.go('login');
    })
});

module.controller('ProfileCtrl', function ($scope, greyscaleAuthSrv, $stateParams, inform, $state, $modal) {
    
    $scope.org = {
        loaded  : false,
        name    : '',
        address : '',
        url     : ''
    };

    greyscaleAuthSrv.self()
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
        var modalInstance = $modal.open({
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

