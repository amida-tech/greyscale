/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('AccessCtrl', function ($scope, NgTableParams, $filter, greyscaleAccessSrv, greyscaleGlobals, _, $log, $uibModal) {
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
                            greyscaleAccessSrv.roles().then(function (list) {
                                params.total(list.length);
                                var orderedData = params.sorting() ?
                                    $filter('orderBy')(list, params.orderBy()) : list;
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
                            greyscaleAccessSrv.roles().then(function (roles) {
                                greyscaleAccessSrv.users().then(function (list) {
                                    params.total(list.length);
                                    for(var l=0; l<list.length; l++) {
                                        list[l].roleID = _.get(_.find(roles, {id : list[l].roleID}),'name');
                                    }
                                    var orderedData = params.sorting() ? $filter('orderBy')(list, params.orderBy()) : list;
                                    $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                                });
                            });
                        }
                    }),
                add: {
                    title: 'Invite',
                    handler: function () {
                        $log.debug('invite :)');
                        $uibModal.open({
                            templateUrl: "views/modals/user-invite.html",
                            controller: 'UserInviteCtrl',
                            size: 'md',
                            windowClass: 'modal fade in'
                        });
                    }
                }

            }
        };
    });
