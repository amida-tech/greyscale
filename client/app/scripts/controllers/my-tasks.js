angular.module('greyscaleApp')
    .controller('MyTasksCtrl', function ($scope, greyscaleMyTasksTbl, greyscaleMyTasksFutureTbl, greyscaleMyTasksFineshedTbl) {
        $scope.model = {
            activeTasks: greyscaleMyTasksTbl,
            futureTasks: greyscaleMyTasksFutureTbl,
            finishedTasks: greyscaleMyTasksFineshedTbl
        };
    });
