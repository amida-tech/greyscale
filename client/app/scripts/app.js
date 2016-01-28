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
    'greyscale.mock',
    'greyscale.core',
    'greyscale.rest',
    'greyscale.tables',
    'inform',
    'lodashAngularWrapper'
]);

_app.config(function ($stateProvider, $logProvider, $locationProvider, $urlMatcherFactoryProvider, $urlRouterProvider,
                      greyscaleEnv, greyscaleGlobalsProvider) {

    var globals = greyscaleGlobalsProvider.$get();

    $logProvider.debugEnabled(greyscaleEnv.enableDebugLog);
    $urlMatcherFactoryProvider.strictMode(false);
    $locationProvider.html5Mode(false);

    var systemRoles = globals.userRoles;

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
                accessLevel: systemRoles.any.mask
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
                accessLevel: systemRoles.any.mask
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
                accessLevel: systemRoles.nobody.mask
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
                accessLevel: systemRoles.any.mask
            },
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/home.html',
                    controller: 'HomeCtrl'
                }
            }
        })
        .state('access', {
            parent: 'home',
            url: 'access',
            data: {
                name: 'Access management',
                accessLevel: systemRoles.superAdmin.mask
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
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
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
                accessLevel: systemRoles.superAdmin.mask
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
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
            }
        })
        .state('projects.setup', {
            url: '/:projectId',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/project-setup.html',
                    controller: 'ProjectSetupCtrl'
                }
            },
            data: {
                name: '',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
            }
        })
        .state('projects.setup.roles', {
            url: '/roles',
            templateUrl: 'views/controllers/project-setup-roles.html',
            controller: 'ProjectSetupRolesCtrl',
            data: {
                name: 'User Roles'
            }
        })
        .state('projects.setup.surveys', {
            url: '/surveys',
            templateUrl: 'views/controllers/project-setup-surveys.html',
            controller: 'ProjectSetupSurveysCtrl',
            data: {
                name: 'Surveys'
            }
        })
        .state('projects.setup.products', {
            url: '/products',
            templateUrl: 'views/controllers/project-setup-products.html',
            controller: 'ProjectSetupProductsCtrl',
            data: {
                name: 'Products'
            }
        })
        .state('projects.setup.tasks', {
            url: '/tasks',
            templateUrl: 'views/controllers/project-setup-tasks.html',
            controller: 'ProjectSetupTasksCtrl',
            data: {
                name: 'Tasks'
            }
        })
        .state('orgs', {
            parent: 'home',
            url: 'organizations',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/organizations.html',
                    controller: 'OrganizationsCtrl'
                }
            },
            data: {
                name: 'Organizations',
                accessLevel: systemRoles.superAdmin.mask
            }
        })
        .state('workflow', {
            parent: 'home',
            url: 'workflow',
            data: {
                name: 'Workflow Steps',
                accessLevel: systemRoles.superAdmin.mask
            },
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/workflow.html',
                    controller: 'WorkflowCtrl'
                }
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
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask | systemRoles.user.mask
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
        })
        .state('visualization', {
            parent: 'home',
            url: 'visualization',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/visualization.html',
                    controller: 'VisualizationCtrl'
                }
            },
            data: {
                name: 'Visualization',
                isPublic: false
            }
        })
        .state('usersUoa', {
            parent: 'home',
            url: 'users-uoa',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/users-uoa.html',
                    controller: 'UsersUoaCtrl'
                }
            },
            data: {
                name: 'Users units of analysis',
                accessLevel: systemRoles.admin.mask | systemRoles.projectManager.mask
            }
        })
        .state('translate', {
            parent: 'home',
            url: 'translate',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/translate.html',
                    controller: 'TranslateCtrl'
                }
            },
            data: {
                name: 'Translate page'
            }
        });

    $urlRouterProvider.otherwise('/');
});

_app.run(function ($state, $stateParams, $rootScope, greyscaleProfileSrv, inform, greyscaleUtilsSrv, greyscaleGlobals) {
    $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
        if (toState.data && toState.data.accessLevel !== greyscaleGlobals.userRoles.all.mask) {
            greyscaleProfileSrv.getAccessLevel().then(function (_level) {
                if ((_level & toState.data.accessLevel) === 0) {
                    e.preventDefault();
                    if ((_level & greyscaleGlobals.userRoles.any.mask) !== 0) { //if not admin accessing admin level page
                        greyscaleUtilsSrv.errorMsg('Access restricted to "' + toState.data.name + '"!');
                        $state.go('home');
                    } else {
                        $stateParams.returnTo = toState.name;
                        $state.go('login');
                    }
                } else {
                    if (fromParams.returnTo && fromParams.returnTo !== toState.name) {
                        $state.go(fromParams.returnTo, {
                            reload: true
                        });
                    }
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
        $state.go('home');
    });
});
