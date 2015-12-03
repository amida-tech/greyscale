/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscaleApp')
    .controller('AccessCtrl', function ($scope, NgTableParams, $filter, greyscaleAccessSrv) {
        $scope.model = {
            roles: {
                editable: false,
                title: 'Roles',
                icon: 'fa-users',
                cols: [
                    {
                        field:'id',
                        title:'ID',
                        show:true
                    },
                    {
                        field:'name',
                        title:'Name',
                        show:true,
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
                        counts:[],
                        getData: function ($defer, params) {
                            greyscaleAccessSrv.roles().then(function (list) {
                                params.total(list.length);
                                var orderedData = params.sorting() ?
                                    $filter('orderBy')(list, params.orderBy()) : list;
                                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                            });
                        }
                    })
            }
        };
    });
