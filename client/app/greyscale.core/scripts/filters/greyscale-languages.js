/**
 * Created by igi on 01.02.16.
 */
'use strict';
angular.module('greyscale.core')
    .filter('languages', function (_) {
        return function (langs, usedItems, trnInd) {
            var res = [];
            for (var l = 0; l < langs.length; l++) {
                var ind = _.findIndex(usedItems, {
                    langId: langs[l].id
                });
                if (ind < 0 || ind === trnInd) {
                    res.push(langs[l]);
                }
            }
            return res;
        };
    });
