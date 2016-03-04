/**
 * Created by dTseytlin on 30.11.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleCountryApi', function (greyscaleRestSrv) {

        function _api() {
            return greyscaleRestSrv().one('countries');
        }

        function _countries() {
            return _api().get();
        }

        function _addCountry(country) {
            return _api().customPOST(country);
        }

        function _deleteCountry(country) {
            return _api().one(country.id + '').remove();
        }

        var _updateCountry = function (country) {
            return _api().one(country.id + '').customPUT(country);
        };

        return {
            list: _countries,
            add: _addCountry,
            update: _updateCountry,
            delete: _deleteCountry
        };
    });
