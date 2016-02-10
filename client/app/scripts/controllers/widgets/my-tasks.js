'use strict';

angular.module('greyscaleApp')
.controller('MyTasksWidget', function($scope, greyscaleMyTasksTbl){

    $scope.model = {};

    greyscaleMyTasksTbl.dataPromise().then(function (data) {
        $scope.model.tasks = data;
    });
});
