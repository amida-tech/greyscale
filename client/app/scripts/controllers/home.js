/**
 * Created by igi on 22.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('HomeCtrl', function ($scope, widgetTableSrv, greyscaleMyTasksTbl) {

        $scope.model = {
            tasks: greyscaleMyTasksTbl
        };

        widgetTableSrv.init({
            scope: $scope,
            model: $scope.model.tasks
        })


    });
