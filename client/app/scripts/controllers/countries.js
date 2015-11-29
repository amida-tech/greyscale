/**
 * Created by dseytlin on 29.11.15.
 */
"use strict";

angular.module('greyscaleApp')
    .controller('CountriesCtrl', function ($state, $scope, greyscaleAuthSrv) {
    	console.log('CountriesCtrl');
    	$scope.countries = [];
    	greyscaleAuthSrv.countries().then(function(list){
    		$scope.countries = list;
    	});
    });
