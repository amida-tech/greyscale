/**
 * Created by igi on 11.04.16.
 */
'use strict';

var _app = angular.module('greyscaleLoginApp', [
    'ngCookies',
    'ngResource',
    'ngTouch',
    'ngTable',
    'ui.bootstrap',
    'ui.router',
    'RDash',
    'greyscale.core',
    'greyscale.rest',
    'inform',
    'lodashAngularWrapper',
    'isteven-multi-select',
    'pascalprecht.translate'
]);

_app.config(function ($stateProvider, $logProvider, $locationProvider, $urlMatcherFactoryProvider, $urlRouterProvider,
    greyscaleEnv, greyscaleGlobalsProvider, i18nProvider, $translateProvider) {

    var globals = greyscaleGlobalsProvider.$get();

    $logProvider.debugEnabled(greyscaleEnv.enableDebugLog);
    $urlMatcherFactoryProvider.strictMode(false);
    $locationProvider.html5Mode(false);

    var systemRoles = globals.userRoles;

    i18nProvider.init($translateProvider);
    _app.useNgLocale = i18nProvider.useNgLocale; // to reinit $locale after async loading of angular-locale

    $stateProvider
        .state('main', {
            templateUrl: '../views/abstract/main.html',
            abstract: true
        })
        .state('login', {
            parent: 'main',
            url: '/login?returnTo',
            views: {
                'body@main': {
                    templateUrl: '../views/controllers/login.html',
                    controller: 'LoginCtrl'
                }
            },
            data: {
                name: 'NAV.LOGIN',
                accessLevel: systemRoles.nobody.mask
            }
        })
        .state('forgot', {
            parent: 'main',
            url: '/forgot',
            views: {
                'body@main': {
                    templateUrl: '../views/controllers/login.html',
                    controller: 'LoginCtrl'
                },
                data: {
                    name: 'NAV.FORGOT',
                    accessLevel: systemRoles.nobody.mask
                }
            }
        })
        .state('reset', {
            parent: 'main',
            url: '/reset/:realm/:token',
            views: {
                'body@main': {
                    templateUrl: 'views/controllers/login.html',
                    controller: 'LoginCtrl'
                }
            },
            data: {
                name: 'NAV.RESET',
                accessLevel: systemRoles.nobody.mask
            }
        });

    $urlRouterProvider.otherwise('/');

});

_app.run(function ($state, $stateParams, $rootScope, greyscaleProfileSrv, inform, greyscaleUtilsSrv, greyscaleGlobals, _) {
    $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
        if (toState.data && toState.data.accessLevel !== greyscaleGlobals.userRoles.all.mask) {

            var params = {
                reload: true,
                inherit: false
            };

            greyscaleProfileSrv.getAccessLevel().then(function (_level) {

                if (toParams.returnTo) {
                    var redirect = $state.get(toParams.returnTo);
                    if ((_level & redirect.data.accessLevel) !== 0) {
                        e.preventDefault();
                        $state.go(redirect.name, {}, params);
                    }
                }

                if ((_level & toState.data.accessLevel) === 0) {
                    e.preventDefault();
                    if ((_level & greyscaleGlobals.userRoles.any.mask) !== 0) { //if not admin accessing admin level page
                        if (toState.name !== 'login') {
                            greyscaleUtilsSrv.errorMsg(toState.data.name, 'ERROR.ACCESS_RESTRICTED');
                        }
                        $state.go('home', {}, params);
                    } else {
                        if (toState.name !== 'home') {
                            $stateParams.returnTo = toState.name;
                        }
                        $state.go('login');
                    }
                } else if (fromParams.returnTo && fromParams.returnTo !== toState.name) {
                    e.preventDefault();
                    $state.go(fromParams.returnTo, {}, params);
                }
            });
        }
    });

    $rootScope.$on('logout', function () {
        greyscaleProfileSrv.logout()
            .finally(function () {
                $state.go('login');
            });
    });

    $rootScope.$on('login', function () {
        greyscaleProfileSrv.getProfile()
            .then(function (profile) {
                var roleId = profile.roleID;
                var roles = greyscaleGlobals.userRoles;
                var role = _.find(roles, {
                    id: roleId
                });
                $state.go((role && role.homeState) ? role.homeState : 'home');
            });
    });

    $state.ext = {};
});
