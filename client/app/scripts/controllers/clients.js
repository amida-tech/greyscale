/**
 * Created by sbabushkin on 26.11.15.
 */
"use strict";

angular.module('greyscaleApp')
    .controller('ClientsCtrl', function ($state, $scope, greyscaleAuthSrv, $modal, inform) {
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

angular.module('greyscaleApp')
    .controller('ClientInviteCtrl', function ($scope, $modalInstance, greyscaleAuthSrv, inform) {
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
    		},function(err){
    			inform.add(err.data.message);
    		});
    	}
    });

angular.module('greyscaleApp')
	.controller('ActivateCtrl', function ($scope, greyscaleAuthSrv, $stateParams, inform, $state) {
		greyscaleAuthSrv.activate($stateParams.token)
		.then(function(resp){
			console.log(resp);
			alert(JSON.stringify(resp));
		},function(err){
			inform.add(err.data.message, {type: 'danger'});
			$state.go('login');
		})
	});

