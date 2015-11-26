/**
 * Created by sbabushkin on 26.11.15.
 */
"use strict";

angular.module('greyscaleApp')
    .controller('ClientsCtrl', function ($state, $scope, greyscaleAuthSrv, $modal) {
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
    .controller('ClientInviteCtrl', function ($scope, $modalInstance, greyscaleAuthSrv) {
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
    			alert(err.data.message); //TODO
    		});
    	}
    });

angular.module('greyscaleApp')
	.controller('ActivateCtrl', function ($scope, greyscaleAuthSrv, $stateParams) {
		greyscaleAuthSrv.activate($stateParams.token)
		.then(function(resp){
			console.log(resp);
			alert(JSON.stringify(resp));
		},function(err){
			alert(err.data.message); //TODO
		})
	});

