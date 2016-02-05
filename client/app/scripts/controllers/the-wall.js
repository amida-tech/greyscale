/**
 * Created by igi on 28.01.16.
 */
'use strict';
angular.module('greyscaleApp')
    .controller('TheWallCtrl', function ($scope, greyscaleUtilsSrv) {
        $scope.model = {
            translation: {
                'essenceId': 4,
                'entityId': 1,
                'field': 'title',
                'langId': 2,
                'value': 'Яблоко'
            }
        };

        greyscaleUtilsSrv.errorMsg('All is fine :)','ERROR.TEST');
    });
