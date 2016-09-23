/**
 * Created by igi on 09.11.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('LoginCtrl', function ($scope, $state, $stateParams, greyscaleProfileSrv, greyscaleRealmSrv, $timeout) {
        var _realm = $stateParams.realm;

        if (_realm) {
            greyscaleRealmSrv.init(_realm);
        }

        $scope.model = {
            state: $state.current.name,
            token: $stateParams.token
        };

        greyscaleProfileSrv.getAccessLevel()
            .then(function (_level) {
                if (_level > 1) {
                    $state.go('home', {});
                }
            });

        /* fix for chrome autofill */
        var timer = setInterval(function () {
            var login = $('#login');
            if (login.length && login.val() !== '') {
                clearInterval(timer);
                var form = login.closest('form').scope().loginForm;
                form.$invalid = false;
                $timeout(function () {
                    $scope.$digest();
                });
            }
        }, 200);
    });
