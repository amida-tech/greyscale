/**
 * Created by dseytlin on 29.11.15.
 *
 * @ngdoc function
 * @name greyscaleApp.controller:CountriesCtrl
 * @description
 * # CountriesCtrl
 * Controller of the greyscaleApp
 */

'use strict';

angular.module('greyscaleApp')
    .controller('CountriesCtrl', function ($scope, $state, greyscaleProfileSrv, greyscaleModalsSrv, greyscaleCountrySrv,
                                           $log, inform, NgTableParams, $filter, greyscaleGlobals, _, $uibModal) {
        var _cols = greyscaleGlobals.tables.countries.cols;

        _cols.push({
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [
                {
                    title: 'Edit',
                    class: 'info',
                    handler: function (country) {
                        inform.add('Edit country');
                        $log.debug(country);
                    }
                },
                {
                    title: 'Delete',
                    class: 'danger',
                    handler: function (country) {
                        greyscaleCountrySrv.deleteCountry(country)
                            .catch(function (err) {
                                inform.add('country delete error: ' + err);
                            })
                            .finally($state.reload);
                    }
                }
            ]
        });
        $scope.model = {
            countries: {
                editable: true,
                title: 'Countries',
                icon: 'fa-table',
                cols: _cols,
                tableParams: new NgTableParams(
                    {
                        page: 1,
                        count: 10,
                        sorting: {id: 'asc'}
                    },
                    {
                        counts: [],
                        getData: function ($defer, params) {
                            greyscaleCountrySrv.countries().then(function (list) {
                                params.total(list.length);
                                var orderedData = params.sorting() ? $filter('orderBy')(list, params.orderBy()) : list;
                                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                            });
                        }
                    }),
                add: {
                    title: 'Add',
                    handler: function () {
                        greyscaleModalsSrv.editCountry();
                    }
                }
            }
        };
    });
