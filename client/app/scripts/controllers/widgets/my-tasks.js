'use strict';

angular.module('greyscaleApp')
.controller('MyTasksWidget', function($scope, greyscaleTaskApi){

    $scope.model = {};

    greyscaleTaskApi.myList()
        .then(function (data) {
            $scope.model.tasks = data;
        });
});
