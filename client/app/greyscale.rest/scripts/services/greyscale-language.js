/**
 * Created by dTseytlin on 19.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleLanguageSrv', function (greyscaleRestSrv) {

        var _api = function(){
            return greyscaleRestSrv().one('languages');
        };

        function _listLanguage() {
            return _api().get();
        }

        function _addLanguage(language) {
            return _api().customPOST(language);
        }

        function _deleteLanguage(language) {
            return _api().one(language.id+'').remove();
        }

        var _updateLanguage = function(language) {
            return _api().one(language.id+'').customPUT(language);
        };

        return {
            list: _listLanguage,
            add: _addLanguage,
            update: _updateLanguage,
            delete: _deleteLanguage
        };
    });
