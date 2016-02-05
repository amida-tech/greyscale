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
    'lodashAngularWrapper',
    'isteven-multi-select',
    'pascalprecht.translate',
    'angularFileUpload'
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
                name: 'NAV.ACTIVATE',
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
                name: 'NAV.REGISTER',
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
                name: 'NAV.LOGIN',
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
                name: 'NAV.HOME',
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
                name: 'NAV.ACCESS_MANAGEMENT',
                icon: 'fa-compass',
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
                name: 'NAV.USERS.TITLE',
                icon: 'fa-users',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
            },
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/users.html',
                    controller: 'UsersCtrl'
                }
            }
        })
        .state('usersList', {
            parent: 'users',
            url: '/list',
            templateUrl: 'views/controllers/users-list.html',
            controller: 'UsersListCtrl',
            data: {
                name: 'NAV.USERS.LIST',
                icon: 'fa-users',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
            }
        })
        .state('usersUoa', {
            parent: 'users',
            url: '/uoa',
            templateUrl: 'views/controllers/users-uoa.html',
            controller: 'UsersUoaCtrl',
            data: {
                name: 'NAV.USERS.UOA',
                icon: 'fa-map',
                accessLevel: systemRoles.admin.mask | systemRoles.projectManager.mask
            }
        })
        .state('usersImport', {
            parent: 'users',
            url: '/import',
            templateUrl: 'views/controllers/users-import.html',
            controller: 'UsersImportCtrl',
            data: {
                name: 'NAV.IMPORT',
                icon: 'fa-upload',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
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
                name: 'NAV.UOAS',
                icon: 'fa-table',
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
                name: 'NAV.PROJECTS_MANAGEMENT',
                icon: 'fa-paper-plane',
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
                name: '{{ext.projectName}}'
            }
        })
        .state('projects.setup.roles', {
            url: '/roles',
            templateUrl: 'views/controllers/project-setup-roles.html',
            controller: 'ProjectSetupRolesCtrl',
            data: {
                name: 'NAV.PROJECTS.USER_ROLES'
            }
        })
        .state('projects.setup.surveys', {
            url: '/surveys',
            templateUrl: 'views/controllers/project-setup-surveys.html',
            controller: 'ProjectSetupSurveysCtrl',
            data: {
                name: 'NAV.PROJECTS.SURVEYS'
            }
        })
        .state('projects.setup.surveys.edit', {
            url: '/:surveyId',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/survey-edit.html',
                    controller: 'SurveyEditCtrl'
                }
            },
            data: {
                name: '{{ext.surveyName}}'
            }
        })
        .state('projects.setup.products', {
            url: '/products',
            templateUrl: 'views/controllers/project-setup-products.html',
            controller: 'ProjectSetupProductsCtrl',
            data: {
                name: 'NAV.PROJECTS.PRODUCTS'
            }
        })
        .state('projects.setup.tasks', {
            url: '/products/:productId',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/product-tasks.html',
                    controller: 'ProductTasksCtrl'
                }
            },
            data: {
                name: 'NAV.PRODUCT_TASKS',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
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
                name: 'NAV.ORGANIZATIONS',
                icon: 'fa-university',
                accessLevel: systemRoles.superAdmin.mask
            }
        })
        .state('workflow', {
            parent: 'home',
            url: 'workflow',
            data: {
                name: 'NAV.WORKFLOW_STEPS',
                icon: 'fa-fast-forward',
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
                name: 'NAV.PROFILE',
                icon: 'fa-user',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask | systemRoles.user.mask
            }
        })
        .state('tasks', {
            parent: 'home',
            url: 'tasks',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/my-tasks.html',
                    controller: 'MyTasksCtrl'
                }
            },
            data: {
                name: 'NAV.TASKS',
                icon: 'fa-tasks',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask | systemRoles.user.mask
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
                name: 'NAV.VISUALIZATION',
                icon: 'fa-globe',
                isPublic: false
            }
        })
        .state('graph', {
            parent: 'home',
            url: 'graph',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/graph.html',
                    controller: 'GraphCtrl'
                }
            },
            data: {
                name: 'Graph',
                icon: 'fa-bar-chart',
                isPublic: false
            }
        })
        .state('table', {
            parent: 'home',
            url: 'table',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/table.html',
                    controller: 'TableCtrl'
                }
            },
            data: {
                name: 'Table',
                icon: 'fa-table',
                isPublic: false
            }
        })
        .state('the-wall', {
            parent: 'home',
            url: 'the-wall',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/the-wall.html',
                    controller: 'TheWallCtrl'
                }
            },
            data: {
                name: 'Page with bricks'
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

    $state.ext = {};
});
