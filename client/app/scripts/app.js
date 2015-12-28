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
    'greyscale.rest',
    'greyscale.tables',
    'inform',
    'lodashAngularWrapper'
]);

_app.config(function ($stateProvider, $logProvider, $locationProvider, $urlMatcherFactoryProvider, $urlRouterProvider) {
    
    $logProvider.debugEnabled(true);
    $urlMatcherFactoryProvider.strictMode(false);
    $locationProvider.html5Mode(false);
    
    $stateProvider
        .state('main',
        {
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
                accessLevel: 0xffff
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
                accessLevel: 0xffff
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
                accessLevel: 0xffff
            }
        })
        .state('dashboard', {
            url: '/?returnTo',
            parent: 'main',
            abstract: true,
            views: {
                'body@main': {
                    templateUrl: 'views/abstract/dashboard.html',
                    controller: 'DashboardCtrl'
                }
            }
        })
        .state('home', {
            parent: 'dashboard',
            url: '',
            data: {
                name: 'Home',
                accessLevel: 0xfffe
            },
            views: {
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
                accessLevel: 0x8000
            },
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/access.html',
                    controller: 'AccessCtrl'
                }
            }
        })
        .state('users', {
            parent: 'home',
            url: 'users',
            data: {
                name: 'Users',
                accessLevel: 0x8000
            },
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/users.html',
                    controller: 'UsersCtrl'
                }
            }
        })
        .state('uoas', {
            parent: 'home',
            url: 'uoas',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/uoas.html',
                    controller: 'UoasCtrl'
                }
                },
            data: {
                name: 'Units of Analysis',
                accessLevel: 0x8000
            }
        })
        .state('projects', {
            parent: 'home',
            url: 'projects',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/projects.html',
                    controller: 'ProjectsCtrl'
                }
            },
            data: {
                name: 'Projects Management',
                accessLevel: 0xC000
            }
        })
        .state('profile', {
            parent: 'home',
            url: 'profile',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/profile.html',
                    controller: 'ProfileCtrl'
                }
            },
            data: {
                name: 'Profile',
                accessLevel: 0xfffe
            }
        })
        .state('survey', {
            parent: 'home',
            url: 'survey',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/survey.html',
                    controller: 'SurveyCtrl'
                }
            },
            data: {
                name: 'Form Builder',
                isPublic: false
            }
        });
    
    $urlRouterProvider.otherwise('/');
});

_app.run(function ($state, $stateParams, $rootScope, greyscaleProfileSrv, inform) {
    $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
        if (toState.data && toState.data.accessLevel !== 0xffff ) {
            greyscaleProfileSrv.getAccessLevel().then(function (_level) {
                if ((_level & toState.data.accessLevel) === 0) {
                    e.preventDefault();
                    if ((_level & 0xfffe) !== 0) { //if not admin accessing admin level page
                        $state.go('home');
                        inform.add('Access restricted to "' + toState.data.name + '"!', {type: 'danger'});
                    } else {
                    $stateParams.returnTo = toState.name;
                    $state.go('login');
                    }
                } else {
                    if (fromParams.returnTo && fromParams.returnTo !== toState.name) {
                        $state.go(fromParams.returnTo, { reload: true });
                    }
                }
            });
            }
        });
    
    $rootScope.$on('logout', function () {
        greyscaleProfileSrv.logout()
            .finally(function(){
        $state.go('login');
    });
    });

    $rootScope.$on('login', function () {
        $state.go('home');
    });
});
