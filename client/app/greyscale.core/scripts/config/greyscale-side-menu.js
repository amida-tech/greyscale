/**
 * Created by igi on 22.12.15.
 */
'use strict';
angular.module('greyscale.core')
    .provider('greyscaleSideMenu', function () {
        var menu = {
            title: 'greyscale',
            groups: [{
                title: 'Administration',
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
                    state: 'usersUoa',
                    icon: 'fa-map'
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
                title: 'Your Content',
                items: [{
                    state: 'profile',
                    icon: 'fa-user'
                }]
            }]
        };

        return {
            $get: function () {
                return menu;
            }
        };
    });
