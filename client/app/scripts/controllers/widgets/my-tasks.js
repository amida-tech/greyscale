'use strict';

angular.module('greyscaleApp')
.controller('MyTasksWidget', function(_, $scope, greyscaleTaskApi){

    $scope.model = {};

    greyscaleTaskApi.myList()
        .then(function (data) {
            $scope.model.tasks = _.filter(data, function(task) {
                return task.status === 'current';
            });
        });
});
