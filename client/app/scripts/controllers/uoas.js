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
    .controller('UoasCtrl', function ($scope, greyscaleUoaTypes, greyscaleUoas, greyscaleUoaClassTypes) {
/*

        // <editor-fold desc="Constants">
        var visibility = [
            {id: 1, name: 'public'},
            {id: 2, name: 'private'}
        ];
        var status = [
            {id: 1, name: 'active'},
            {id: 2, name: 'inactive'},
            {id: 3, name: 'deleted'}
        ];
        // </editor-fold desc="Constants">

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

        // <editor-fold desc="Language">
        var _getLanguages = function () {
            return greyscaleLanguageSrv.list();
        };
        var _colsLanguage = angular.copy(greyscaleGlobals.tables.languages.cols);
        var _langPromise = greyscaleLanguageSrv.list;

        // </editor-fold desc="Language">

*/

        $scope.model = {
/*
            countries: {
                editable: true,
                title: 'Countries',
                icon: 'fa-table',
                cols: _colsCountry,
                dataPromise: _countryPromise,
                pageLength: 3,
                sorting: {name: 'asc'},
                add: {
                    title: 'Add',
                    handler: _updateCountry
                }
            },
*/
/*
            languages: {
                editable: false,
                title: 'Languages',
                icon: 'fa-table',
                cols: _colsLanguage,
                dataPromise: _langPromise
            },
*/
            uoas: greyscaleUoas,
            uoaTypes: greyscaleUoaTypes,
            uoaClassTypes: greyscaleUoaClassTypes
        };
    });
