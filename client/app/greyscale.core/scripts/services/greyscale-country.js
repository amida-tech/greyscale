/**
 * Created by dTseytlin on 30.11.15.
 */
'use strict';

angular.module('greyscale.core')
    .factory('greyscaleCountrySrv', function ($rootScope, $q, Restangular, $log,
                                           greyscaleRestSrv, greyscaleProfileSrv) {

        function _countries() {
            return greyscaleRestSrv({"token": greyscaleProfileSrv.token()})
                .one('countries')
                .get();
        }
        function _addCountry(country) {
            return greyscaleRestSrv({"token": greyscaleProfileSrv.token()})
                .one('countries')
                .customPOST(country);
        }
        function _deleteCountry(country) {
            return greyscaleRestSrv({"token": greyscaleProfileSrv.token()})
                .one('countries')
                .remove(country);
        }

        return {
            countries: _countries,
            addCountry: _addCountry,
            deleteCountry: _deleteCountry
        };
    });
