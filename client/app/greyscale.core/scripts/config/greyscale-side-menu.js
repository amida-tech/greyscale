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
                states: ['projects.setup.products', 'access', 'uoas', /*'orgs', */ 'users']
            }, {
                title: 'NAV.CONTENT_SECTION',
                states: ['policy', 'profile', 'tasks', 'visualizations', 'graph', 'table']
            }]
        };

        return {
            $get: function () {
                return menu;
            }
        };
    });
