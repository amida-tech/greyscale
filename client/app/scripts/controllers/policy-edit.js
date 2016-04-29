/**
 * Created by igi on 29.04.16.
 */
'use strict';
angular.module('greyscaleApp')
.controller('PolicyEditCtrl', function($scope, $state, $stateParams ){
        $scope.model = {
            id: $stateParams.id
        };
    });
