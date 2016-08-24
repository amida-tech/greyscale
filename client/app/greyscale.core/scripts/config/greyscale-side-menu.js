/**
 * Created by igi on 22.12.15.
 */
'use strict';
angular.module('greyscale.core')
    .provider('greyscaleSideMenu', function () {
        var menu = {
            title: 'greyscale',
            groups: [{
                title: 'NAV.SUPERADMIN_SECTION',
                states: ['organizations', 'superusers']
            }, {
                title: 'NAV.ADMIN_SECTION',
                states: [
                    [
                        {title: 'NAV.PROJECT_MANAGEMENT', icon: 'fa-home'},
                        ['projects.setup.products', 'policy', 'workflowTemplates']
                    ],
                    'access',
                    /*'uoas',*/
                    /*'orgs', */
                    'users'
                ]
            }, {
                title: 'NAV.CONTENT_SECTION',
                states: ['profile', 'tasks', 'visualizations', 'graph', 'table']
            }]
        };

        return {
            $get: function () {
                return menu;
            }
        };
    });
