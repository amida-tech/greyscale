/**
 * Created by dseytlin on 29.11.15.
 *
 * @ngdoc function
 * @name greyscaleApp.controller:UoasCtrl
 * @description
 * # UoasCtrl
 * Controller (Unit of Analysis) of the greyscaleApp
 */

'use strict';

angular.module('greyscaleApp')
    .controller('UoasCtrl', function ($scope, $state, greyscaleProfileSrv, greyscaleModalsSrv, greyscaleCountrySrv, greyscaleUoaTypeSrv,
                                           $log, inform, NgTableParams, $filter, greyscaleGlobals) {

        var _colsCountry = angular.copy(greyscaleGlobals.tables.countries.cols);

        var _tableParamsCountry = new NgTableParams(
            {
                page: 1,
                count: 5,
                sorting: {id: 'asc'}
            },
            {
                counts: [],
                getData: function ($defer, params) {
                    greyscaleCountrySrv.list().then(function (list) {
                        params.total(list.length);
                        var orderedData = params.sorting() ? $filter('orderBy')(list, params.orderBy()) : list;
                        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    });
                }
            });

        var _updateTableCountry = function () {
            _tableParamsCountry.reload();
            return true;
        };

        var _updateCountry = function(_country) {
            greyscaleModalsSrv.editCountry(_country)
                .then(function(country){
                    if (_country && country.id) {
                        return greyscaleCountrySrv.update(country);
                    } else {
                        return greyscaleCountrySrv.add(country);
                    }
                })
                .then(_updateTableCountry)
                .catch(function(err){
                    if (err) {
                        inform.add(err, {type: 'danger'});
                    }
                });
        };


        _colsCountry.push({
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [
                {
                    title: 'Edit',
                    class: 'info',
                    handler: _updateCountry
                },
                {
                    title: 'Delete',
                    class: 'danger',
                    handler: function (country) {
                        greyscaleCountrySrv.delete(country)
                            .then(function(){
                                _updateTableCountry(true);
                            })
                            .catch(function (err) {
                                inform.add('country delete error: ' + err);
                            });
                    }
                }
            ]
        });

        var _colsUoaType = angular.copy(greyscaleGlobals.tables.UnitOfAnalysisType.cols);

        var _updateTableUoaType = function () {
            _tableParamsUoaType.reload();
            return true;
        };

        var _updateUoaType = function(_uoaType) {
            greyscaleModalsSrv.editUoaType(_uoaType)
                .then(function(uoaType){
                    if (_uoaType && uoaType.id) {
                        return greyscaleUoaTypeSrv.update(uoaType);
                    } else {
                        return greyscaleUoaTypeSrv.add(uoaType);
                    }
                })
                .then(_updateTableUoaType)
                .catch(function(err){
                    if (err) {
                        inform.add(err, {type: 'danger'});
                    }
                });
        };

        var _tableParamsUoaType = new NgTableParams(
            {
                page: 1,
                count: 5,
                sorting: {id: 'asc'}
            },
            {
                counts: [],
                getData: function ($defer, params) {
                    greyscaleUoaTypeSrv.list().then(function (list) {
                        params.total(list.length);
                        var orderedData = params.sorting() ? $filter('orderBy')(list, params.orderBy()) : list;
                        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    });
                }
            });

        _colsUoaType.push({
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [
                {
                    title: 'Edit',
                    class: 'info',
                    handler: _updateUoaType
                },
                {
                    title: 'Delete',
                    class: 'danger',
                    handler: function (UnitOfAnalysisType) {
                        greyscaleUoaTypeSrv.delete(UnitOfAnalysisType)
                            .then(function(){
                                _updateTableUoaType(true);
                            })
                            .catch(function (err) {
                                inform.add('UnitOfAnalysisType delete error: ' + err);
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
                cols: _colsCountry,
                tableParams: _tableParamsCountry,
                add: {
                    title: 'Add',
                    handler: _updateCountry
                }
            },
            uoaTypes: {
                editable: true,
                title: 'Unit of Analysis Types',
                icon: 'fa-table',
                cols: _colsUoaType,
                tableParams: _tableParamsUoaType,
                add: {
                    title: 'Add',
                    handler: _updateUoaType
                }
            }
        };
    });
