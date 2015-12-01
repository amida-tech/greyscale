'use strict';

/**
 * @ngdoc overview
 * @name greyscaleApp
 * @description
 * # greyscaleApp
 *
 * Main module of the application.
 */
var _app = angular.module('greyscaleApp', [
    'ngCookies',
    'ngResource',
    'ngMessages',
    'ngTouch',
    'ui.bootstrap',
    'ui.router',
    'RDash',
    'greyscale.core',
    'greyscale.user',
    'inform'
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
        .state('activate', {
            url: '/activate/:token',
            templateUrl: 'views/controllers/activation.html',
            controller: 'ActivateCtrl',
            data: {
                name: 'Activate',
                isPublic: true
            }
        })
        .state('register', {
            url: '/register',
            templateUrl: 'views/controllers/register.html',
            controller: 'RegisterCtrl',
            data: {
                name: 'Register',
                isPublic: true
            }
        })
        // .state('activation', {
        //     url: '/activation',
        //     templateUrl: 'views/controllers/activation.html',
        //     controller: 'ActiovationCtrl',
        //     data: {
        //         name: 'Actiovation',
        //         isPublic: true
        //     }
        // })
        .state('login', {
            url: '/login?returnTo',
            templateUrl: 'views/controllers/login.html',
            controller: 'LoginCtrl',
            data: {
                name: 'Login',
                isPublic: true
            }
        })
        .state('main.clients', {
            url: 'clients',
            templateUrl: 'views/controllers/clients.html',
            controller: 'ClientsCtrl',
            data: {
                name: 'Clients',
                isPublic: true
            }
        })
        .state('main.countries', {
            url: 'countries',
            templateUrl: 'views/controllers/countries.html',
            controller: 'CountriesCtrl',
            data: {
                name: 'Countries',
                isPublic: true
            }
        })
        .state('main.profile', {
            url: 'profile',
            templateUrl: 'views/controllers/profile.html',
            controller: 'ProfileCtrl',
            data: {
                name: 'Profile',
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
