/**
 * Created by igi on 09.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('LoginCtrl', function ($state, greyscaleProfileSrv, $log) {
        greyscaleProfileSrv.getAccessLevel()
            .then(function (_level) {
                if (_level > 1) {
                    $log.debug('logged in. go home');
                    $state.go('home', {});
                }
            });
    });
