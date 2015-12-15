/**
 * Created by dTseytlin on 30.11.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleCountrySrv', function (greyscaleRestSrv) {

        function _countries() {
            return greyscaleRestSrv()
                .one('countries')
                .get();
        }
        function _addCountry(country) {
            return greyscaleRestSrv()
                .one('countries')
                .customPOST(country);
        }
        function _deleteCountry(country) {
            return greyscaleRestSrv()
                .one('countries')
                .remove(country);
        }

        return {
            countries: _countries,
            addCountry: _addCountry,
            deleteCountry: _deleteCountry
        };
    });
