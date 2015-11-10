'use strict';

/**
 * @ngdoc overview
 * @name greyscaleClientApp
 * @description
 * # greyscaleClientApp
 *
 * Main module of the application.
 */
var _app = angular.module('greyscaleClientApp', [
    'ngCookies',
    'ngResource',
    'ngTouch',
    'ui.bootstrap',
    'ui.router',
    'RDash',
    'greyscale.core'
]);

_app.config(function ($stateProvider, $logProvider, $locationProvider, $urlMatcherFactoryProvider, $urlRouterProvider) {

    $logProvider.debugEnabled(true);
    $urlMatcherFactoryProvider.strictMode(false);
    $locationProvider.html5Mode(false);

    $stateProvider
        .state('main', {
            url: '/',
            templateUrl: 'views/controllers/main.html',
            controller: 'MainCtrl',
            data: {
                name: '',
                isPublic: false
            }
        })
        .state('login', {
            url: '/login?returnTo',
            templateUrl: 'views/controllers/login.html',
            controller: 'LoginCtrl',
            data: {
                name: 'Login',
                isPublic: true
            }
        });
    $urlRouterProvider.otherwise('/');
});

_app.run(function ($state, $stateParams, $rootScope, greyscaleAuthSrv) {
    $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
        //if rule not defined
        if (!angular.isDefined(toState.data.isPublic)) {
            return;
        }
        //Check auth
        greyscaleAuthSrv.isAuthenticated().then(function (isAuthenticated) {
            //if private state and user is not authenticated
            if (!toState.data.isPublic) {
                if (!isAuthenticated) {
                    e.preventDefault();
                    $stateParams.returnTo = toState.name;
                    $state.go('login');
                } else {
                    if (fromParams.returnTo && fromParams.returnTo !== toState.name) {
                        $state.go(fromParams.returnTo, {reload: true});
                    }
                }
            }
        });
    });

    $rootScope.$on('logout', function(){
        $state.go('login');
    })
});
