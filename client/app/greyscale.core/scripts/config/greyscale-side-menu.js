/**
 * Created by igi on 22.12.15.
 */
angular.module('greyscale.core')
    .provider('greyscaleSideMenu', function () {
        var menu = {
            title: 'greyscale',
            groups: [
                {
                    title: 'Administration',
                    items: [
                        {
                            state: 'access',
                            icon: 'fa-compass'
                        },
                        {
                            state: 'uoas',
                            icon: 'fa-table'
                        },
                        {
                            state: 'users',
                            icon: 'fa-group'
                        },
                        {
                            state: 'orgs',
                            icon: 'fa-university'
                        },
                        {
                            state: 'projects',
                            icon: 'fa-paper-plane'
                        }

                    ]
                },
                {
                    title: 'Your Content',
                    items: [
                        {
                            state:'profile',
                            icon: 'fa-user'
                        }]
                }
            ]
        };

        return {
            $get: function () {
                return menu;
            }
        };
    });
