/**
 * Created by dTseytlin on 30.11.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleCountrySrv', function (greyscaleRestSrv) {

        var _api = function(){
            return greyscaleRestSrv().one('countries');
        };

        function _countries() {
            return _api().get();
        }

        function _addCountry(country) {
            return _api().customPOST(country);
        }

        function _deleteCountry(country) {
            return _api().remove(country);
        }

        var _update = function(country) {
            return _api().one(country.id+'').customPUT(country);
        };

        return {
            list: _countries,
            add: _addCountry,
            update: _update,
            delete: _deleteCountry
        };
    });
