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
                                           $log, inform, NgTableParams, $filter, greyscaleGlobals) {

        var _cols = angular.copy(greyscaleGlobals.tables.countries.cols);

        var _tableParams = new NgTableParams(
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
            });

        var _updateTable = function (res) {
            $log.debug(res);
            if (res) {
                $log.debug('reloading table...');
                _tableParams.reload();
            }
        };

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
                        greyscaleModalsSrv.editCountry(country).then(_updateTable);
                    }
                },
                {
                    title: 'Delete',
                    class: 'danger',
                    handler: function (country) {
                        greyscaleCountrySrv.deleteCountry(country)
                            .then(function(){
                                _updateTable(true);
                            })
                            .catch(function (err) {
                                inform.add('country delete error: ' + err);
                            });
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
                tableParams: _tableParams,
                add: {
                    title: 'Add',
                    handler: function () {
                        greyscaleModalsSrv.editCountry().then(_updateTable);
                    }
                }
            }
        };
    });
