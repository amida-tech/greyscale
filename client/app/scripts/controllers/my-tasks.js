angular.module('greyscaleApp')
    .controller('MyTasksCtrl', function ($scope, greyscaleMyTasksTbl) {
        $scope.model = {
            tasks: greyscaleMyTasksTbl
        };
    });
