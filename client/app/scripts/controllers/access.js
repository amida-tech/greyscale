/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('AccessCtrl', function ($scope, NgTableParams, $filter, greyscaleProfileSrv, greyscaleRoleSrv,
                                        greyscaleUserSrv, greyscaleGlobals, greyscaleModalsSrv, _) {
        $scope.model = {
            roles: {
                editable: false,
                title: 'Roles',
                icon: 'fa-users',
                cols: [
                    {
                        field: 'id',
                        title: 'ID',
                        show: true
                    },
                    {
                        field: 'name',
                        title: 'Name',
                        show: true,
                        sortable: false
                    }
                ],
                tableParams: new NgTableParams(
                    {
                        page: 1,
                        count: 5,
                        sorting: {id: 'asc'}
                    },
                    {
                        counts: [],
                        getData: function ($defer, params) {
                            greyscaleProfileSrv.getProfile()
                                .then(greyscaleRoleSrv.list)
                                .then(function (roles) {
                                    params.total(roles.length);
                                    var orderedData = params.sorting() ?
                                        $filter('orderBy')(roles, params.orderBy()) : roles;
                                    $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                                });
                        }
                    })
            },
            users: {
                editable: true,
                title: 'Users',
                icon: 'fa-users',
                cols: greyscaleGlobals.tables.users.cols,
                tableParams: new NgTableParams(
                    {
                        page: 1,
                        count: 5,
                        sorting: {id: 'asc'}
                    },
                    {
                        counts: [],
                        getData: function ($defer, params) {
                            greyscaleProfileSrv.getProfile()
                                .then(greyscaleRoleSrv.list)
                                .then(function (roles) {
                                    greyscaleUserSrv.list().then(function (users) {
                                        params.total(users.length);
                                        for (var l = 0; l < users.length; l++) {
                                            users[l].roleID = _.get(_.find(roles, {id: users[l].roleID}), 'name');
                                        }
                                        var orderedData = params.sorting() ? $filter('orderBy')(users, params.orderBy()) : users;
                                        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                                    });
                                });
                        }
                    }),
                add: {
                    title: 'Invite',
                    handler: greyscaleModalsSrv.inviteUser
                }

            }
        };
    });
