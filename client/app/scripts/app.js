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
    'angularFileUpload',
    'ui.sortable',
    'ngFileSaver'
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
                accessLevel: systemRoles.nobody.mask
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
        .state('forgot', {
            parent: 'main',
            url: '/forgot',
            views: {
                'body@main': {
                    templateUrl: 'views/controllers/login.html',
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
            url: '/reset/:token',
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
        .state('usersGroups', {
            parent: 'users',
            url: '/groups',
            templateUrl: 'views/controllers/users-groups.html',
            controller: 'UsersGroupsCtrl',
            data: {
                name: 'NAV.USERS.GROUPS'
            }
        })
        //.state('usersUoa', {
        //    parent: 'users',
        //    url: '/uoa',
        //    templateUrl: 'views/controllers/users-uoa.html',
        //    controller: 'UsersUoaCtrl',
        //    data: {
        //        name: 'NAV.USERS.UOA',
        //        icon: 'fa-map',
        //        accessLevel: systemRoles.admin.mask | systemRoles.projectManager.mask
        //    }
        //})
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
                name: 'NAV.UOAS.TITLE',
                icon: 'fa-table',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
            }
        })
        .state('uoasList', {
            parent: 'uoas',
            url: '/list',
            templateUrl: 'views/controllers/uoas-list.html',
            controller: 'UoasListCtrl',
            data: {
                name: 'NAV.UOAS.LIST',
                icon: 'fa-table',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
            }
        })
        .state('uoasImport', {
            parent: 'uoas',
            url: '/import',
            templateUrl: 'views/controllers/uoas-import.html',
            controller: 'UoasImportCtrl',
            data: {
                name: 'NAV.IMPORT',
                icon: 'fa-upload',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
            }
        })
        .state('projects', {
            parent: 'home',
            data: {
                name: null,
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
            }
        })
        .state('projects.setup', {
            //url: '/:projectId',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/project-setup.html',
                    controller: 'ProjectSetupCtrl'
                }
            },
            data: {
                //name: '{{ext.projectName}}'
            }
        })
        .state('projects.setup.surveys', {
            url: 'surveys',
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
            url: 'projects',
            templateUrl: 'views/controllers/project-setup-products.html',
            controller: 'ProjectSetupProductsCtrl',
            data: {
                //name: 'NAV.PROJECTS.PRODUCTS'
                name: 'NAV.PROJECT_MANAGEMENT',
                icon: 'fa-paper-plane'
            }
        })
        .state('projects.setup.tasks', {
            parent: 'projects.setup.products',
            url: '/:productId/tasks',
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
        .state('projects.setup.indexes', {
            parent: 'projects.setup.products',
            url: '/:productId/indexes',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/product-indexes.html',
                    controller: 'ProductIndexesCtrl'
                }
            },
            data: {
                name: 'NAV.PRODUCT_INDEXES',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
            }
        })
        .state('pmProductDashboard', {
            parent: 'home',
            url: 'pm/:productId',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/pm-dashboard-product.html',
                    controller: 'PmDashboardProductCtrl'
                }
            },
            data: {
                name: 'NAV.PM_PRODUCT_DASHBOARD',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask | systemRoles.user.mask
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
                accessLevel: systemRoles.admin.mask | systemRoles.user.mask
            }
        })
        /*.state('visualization', {
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
                accessLevel: systemRoles.superAdmin.mask
            }
        })*/
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
                name: 'NAV.GRAPH',
                icon: 'fa-bar-chart',
                accessLevel: systemRoles.superAdmin.mask
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
                name: 'NAV.TABLE',
                icon: 'fa-table',
                accessLevel: systemRoles.superAdmin.mask
            }
        })
        /*.state('index-visualization', {
            parent: 'home',
            url: 'index-visualization',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/index-visualization.html',
                    controller: 'IndexVisualizationCtrl'
                }
            },
            data: {
                name: 'NAV.INDEX-VISUALIZATION',
                icon: 'fa-globe',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
            }
        })*/
        .state('visualizations', {
            parent: 'home',
            url: 'visualizations',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/visualizations.html',
                    controller: 'VisualizationsCtrl'
                }
            },
            data: {
                name: 'NAV.VISUALIZATIONS',
                icon: 'fa-globe',
                accessLevel: systemRoles.superAdmin.mask | systemRoles.admin.mask
            }
        })
        .state('visualization', {
            parent: 'visualizations',
            url: '/:visualizationId',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/index-visualization.html',
                    controller: 'IndexVisualizationCtrl'
                }
            },
            data: {
                name: 'Visualization'
            }
        })
        .state('survey', {
            parent: 'home',
            url: 'survey/:surveyId/task/:taskId?',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/survey.html',
                    controller: 'SurveyCtrl'
                }
            },
            data: {
                name: 'NAV.SURVEY',
                icon: 'fa-question',
                accessLevel: systemRoles.any.mask
            }
        })
        .state('notifications', {
            parent: 'home',
            url: 'notifications',
            views: {
                'body@dashboard': {
                    templateUrl: 'views/controllers/notifications.html',
                    controller: 'NotificationsCtrl'
                }
            },
            data: {
                name: 'NAV.NOTIFICATIONS',
                icon: 'fa-envelope',
                accessLevel: systemRoles.any.mask
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
                $state.go(role.homeState || 'home');
            });
    });

    $state.ext = {};
});
