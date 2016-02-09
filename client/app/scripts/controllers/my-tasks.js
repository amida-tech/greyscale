angular.module('greyscaleApp')
    .controller('MyTasksCtrl', function ($scope, greyscaleMyTasksTbl) {

        $scope.model = {
            tasks: greyscaleMyTasksTbl
        };

        //
        //$scope.selectUoa = function (uoa) {
        //    if (typeof uoa !== 'undefined') {
        //        $scope.model.uoaTagLinks.query = {
        //            uoaId: uoa.id
        //        };
        //        $scope.model.uoaTagLinks.tableParams.reload();
        //    }
        //    return $scope.model.uoas.current;
        //};

    });
