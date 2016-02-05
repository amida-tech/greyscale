/**
 * Created by igi on 22.12.15.
 */
'use strict';
angular.module('greyscale.core')
    .provider('greyscaleSideMenu', function () {
        var menu = {
            title: 'greyscale',
            groups: [{
                title: 'NAV.ADMIN_SECTION',
                states: ['access', 'uoas', 'users', 'orgs', 'projects', 'workflow']
            }, {
                title: 'NAV.CONTENT_SECTION',
                states: ['profile', 'tasks', 'visualization', 'graph', 'table']
            }]
        };

        return {
            $get: function () {
                return menu;
            }
        };
    });
