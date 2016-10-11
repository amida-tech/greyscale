/**
 * Created by dTseytlin on 19.12.15.
 */
'use strict';

angular.module('greyscale.rest')
    .factory('greyscaleLanguageApi', function (greyscaleRestSrv) {

        return {
            list: _listLanguage,
            add: _addLanguage,
            update: _updateLanguage,
            delete: _deleteLanguage
        };

        function _api() {
            return greyscaleRestSrv.api().one('languages');
        }

        function _prepareData(resp) {
            if (resp) {
                return resp.plain();
            } else {
                return resp;
            }
        }

        function _listLanguage() {
            return _api().get().then(_prepareData);
        }

        function _addLanguage(language) {
            return _api().customPOST(language).then(_prepareData);
        }

        function _deleteLanguage(language) {
            return _api().one(language.id + '').remove().then(_prepareData);
        }

        function _updateLanguage(language) {
            return _api().one(language.id + '').customPUT(language).then(_prepareData);
        }
    });
