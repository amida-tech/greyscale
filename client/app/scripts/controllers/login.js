/**
 * Created by igi on 09.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('LoginCtrl', function ($scope, $state, greyscaleProfileSrv, $log) {
        $scope.model = {
            state: $state.current.name
        };

        $log.debug($state);
        greyscaleProfileSrv.getAccessLevel()
            .then(function (_level) {
                if (_level > 1) {
                    $state.go('home', {});
                }
            });
    });
