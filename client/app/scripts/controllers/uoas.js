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
    .controller('UoasCtrl', function ($scope, $state, $log, inform, NgTableParams, $filter,
                                      greyscaleProfileSrv,
                                      greyscaleModalsSrv,
                                      greyscaleCountrySrv,
                                      greyscaleUoaSrv,
                                      greyscaleUoaTypeSrv,
                                      greyscaleLanguageSrv,
                                      greyscaleGlobals) {

        // <editor-fold desc="Country">
        var _colsCountry = angular.copy(greyscaleGlobals.tables.countries.cols);
        var _countryPromise = greyscaleCountrySrv.list;
        var _updateTableCountry = function () {
            $scope.model.countries.tableParams.reload();
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
                            .then(_updateTableCountry)
                            .catch(function (err) {
                                inform.add('country delete error: ' + err);
                            });
                    }
                }
            ]
        });
        // </editor-fold desc="Country">

        // <editor-fold desc="Unit of Analysis">
        var _colsUoa = angular.copy(greyscaleGlobals.tables.uoas.cols);

        var _updateTableUoa = function () {
            $scope.model.uoas.tableParams.reload();
        };

        var _updateUoa = function(_uoa) {
            greyscaleModalsSrv.editUoa(_uoa)
                .then(function(uoa){
                    if (_uoa && uoa.id) {
                        return greyscaleUoaSrv.update(uoa);
                    } else {
                        return greyscaleUoaSrv.add(uoa);
                    }
                })
                .then(_updateTableUoa)
                .catch(function(err){
                    if (err) {
                        inform.add(err, {type: 'danger'});
                    }
                });
        };

        var _uoaPromise = greyscaleUoaSrv.list;

        _colsUoa.push({
            field: '',
            title: '',
            show: true,
            dataFormat: 'action',
            actions: [
                {
                    title: 'Edit',
                    class: 'info',
                    handler: _updateUoa
                },
                {
                    title: 'Delete',
                    class: 'danger',
                    handler: function (UnitOfAnalysis) {
                        greyscaleUoaSrv.delete(UnitOfAnalysis)
                            .then(_updateTableUoa)
                            .catch(function (err) {
                                inform.add('Unit Of Analysis delete error: ' + err);
                            });
                    }
                }
            ]
        });
        // </editor-fold desc="Unit of Analysis">

        // <editor-fold desc="Unit of Analysis Type">
        var _colsUoaType = angular.copy(greyscaleGlobals.tables.uoaTypes.cols);

        var _updateTableUoaType = function () {
            $scope.model.uoaTypes.tableParams.reload();
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

        var _uoaTypePromise = greyscaleUoaTypeSrv.list;

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
                            .then(_updateTableUoaType)
                            .catch(function (err) {
                                inform.add('UnitOfAnalysisType delete error: ' + err);
                            });
                    }
                }
            ]
        });
        // </editor-fold desc="Unit of Analysis Type">

        // <editor-fold desc="Language">
        var _colsLanguage = angular.copy(greyscaleGlobals.tables.languages.cols);
        var _langPromise = greyscaleLanguageSrv.list;

        // </editor-fold desc="Language">

        $scope.model = {
            countries: {
                editable: true,
                title: 'Countries',
                icon: 'fa-table',
                cols: _colsCountry,
                dataPromise: _countryPromise,
                add: {
                    title: 'Add',
                    handler: _updateCountry
                }
            },
            uoas: {
                editable: true,
                title: 'Unit of Analysis',
                icon: 'fa-table',
                cols: _colsUoa,
                dataPromise: _uoaPromise,
                add: {
                    title: 'Add',
                    handler: _updateUoa
                }
            },
            uoaTypes: {
                editable: true,
                title: 'Unit of Analysis Types',
                icon: 'fa-table',
                cols: _colsUoaType,
                dataPromise: _uoaTypePromise,
                add: {
                    title: 'Add',
                    handler: _updateUoaType
                }
            },
            languages: {
                editable: false,
                title: 'Languages',
                icon: 'fa-table',
                cols: _colsLanguage,
                dataPromise: _langPromise
            }
        };
    });
