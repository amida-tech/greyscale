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
                items: [{
                    state: 'access',
                    icon: 'fa-compass'
                }, {
                    state: 'uoas',
                    icon: 'fa-table'
                }, {
                    state: 'users',
                    icon: 'fa-group'
                }, {
                    state: 'orgs',
                    icon: 'fa-university'
                }, {
                    state: 'projects',
                    icon: 'fa-paper-plane'
                }, {
                    state: 'workflow',
                    icon: 'fa-fast-forward'
                }]
            }, {
                title: 'NAV.CONTENT_SECTION',
                items: [{
                    state: 'profile',
                    icon: 'fa-user'
                }, {
                    state: 'tasks',
                    icon: 'fa-tasks'
                }]
            }]
        };

        return {
            $get: function () {
                return menu;
            }
        };
    });
