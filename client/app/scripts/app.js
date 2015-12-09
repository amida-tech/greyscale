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
    'ngTable',
    'ui.bootstrap',
    'ui.router',
    'RDash',
    'greyscale.core',
    'greyscale.user',
    'inform',
    'lodashAngularWrapper'
]);

_app.config(function ($stateProvider, $logProvider, $locationProvider, $urlMatcherFactoryProvider, $urlRouterProvider) {

    $logProvider.debugEnabled(true);
    $urlMatcherFactoryProvider.strictMode(false);
    $locationProvider.html5Mode(false);

    $stateProvider
        .state('main', {
            templateUrl: 'views/abstract/main.html',
            abstract: true
        })
        .state('activate', {
            parent: 'main',
            url: '/activate/:token',
            views: {
                'body@main': {
                    templateUrl: 'views/controllers/activation.html',
                    controller: 'ActivateCtrl'
                }
            },
            data: {
                name: 'Activate',
                isPublic: true
            }
        })
        .state('register', {
            parent: 'main',
            url: '/register',
            views: {
                'body@main': {
                    templateUrl: 'views/controllers/register.html',
                    controller: 'RegisterCtrl'
                }
            },
            data: {
                name: 'Register',
                isPublic: true
            }
        })
        .state('login', {
            parent: 'main',
            url: '/login?returnTo',
            views: {
                'body@main': {
                    templateUrl: 'views/controllers/login.html',
                    controller: 'LoginCtrl'
                }
            },
            data: {
                name: 'Login',
                isPublic: true
            }
        })
        .state('dashboard', {
            url:'/',
            parent: 'main',
            abstract: true,
            views: {
                'body@main':{
                    templateUrl: 'views/abstract/dashboard.html'
                }
            }
        })
        .state('home',{
            parent:'dashboard',
            url:'',
            data: {
                name: 'Home',
                isPublic: false
            },
            views: {
                'header@dashboard' : {
                    templateUrl: 'views/controllers/dashboard-header.html',
                    controller: 'DashboardHeaderCtrl'
                },
                'body@dashboard': {
                    template: ''
                }
            }
        })
        .state('access', {
            parent: 'home',
            url: 'access',
            data: {
                name: 'Access management',
                isPublic: false
            },
            views: {
                'header@dashboard' : {
                    templateUrl: 'views/controllers/dashboard-header.html',
                    controller: 'DashboardHeaderCtrl'
                },
                'body@dashboard': {
                    templateUrl: 'views/controllers/access.html',
                    controller: 'AccessCtrl'
                }
            }
        })
        .state('countries', {
            parent:'home',
            url: 'countries',
            views:{
                'header@dashboard' : {
                    templateUrl: 'views/controllers/dashboard-header.html',
                    controller: 'DashboardHeaderCtrl'
                },
                'body@dashboard': {
                    templateUrl: 'views/controllers/countries.html',
                    controller: 'CountriesCtrl'
                }
            },
            data: {
                name: 'Countries',
                isPublic: false
            }
        })
        .state('profile', {
            parent:'home',
            url: 'profile',
            views: {
                'header@dashboard' : {
                    templateUrl: 'views/controllers/dashboard-header.html',
                    controller: 'DashboardHeaderCtrl'
                },
                'body@dashboard': {
                    templateUrl: 'views/controllers/profile.html',
                    controller: 'ProfileCtrl'
                }
            },
            data: {
                name: 'Profile',
                isPublic: false
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

    $rootScope.$on('logout', function () {
        $state.go('login');
    });
    $rootScope.$on('login', function () {
        $state.go('home');
    });
});
