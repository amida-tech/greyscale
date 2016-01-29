/**
 * Created by igi on 29.01.16.
 */
'use strict';
angular.module('greyscale.mock')
    .factory('greyscaleTranslationMock', function ($httpBackend, greyscaleUtilsSrv, $log, $filter) {
        var _translations = [
            {
                'essenceId': 4,
                'entityId': 1,
                'field': 'title',
                'langId': 2,
                'value': 'Яблоко'
            },
            {
                'essenceId': 4,
                'entityId': 2,
                'field': 'title',
                'langId': 2,
                'value': 'Арбуз'
            }
        ];

        var expr = /\/translations(\/(\d+)(\/(\d+))?)?.*mock.*/;

        return function () {
            $httpBackend.whenGET(expr)
                .respond(function (method, url) {
                    var param = expr.exec(url);
                    var entityType = param[2], entryId = param[4];
                    var urlParts = greyscaleUtilsSrv.parseURL(url);

                    var filter = urlParts.params || {};

                    if (param[2]) {
                        filter.essenceId = param[2];
                        if (param[4]) {
                            filter.entityId = param[4];
                        }
                    }

                    $log.debug(param, filter);
                    $log.debug('mocking ' + method + ' :' + url);
                    var res = _translations;
                    if (filter) {
                        res = $filter('filter')(res, filter);
                    }
                    $log.debug(res);
                    return [200, res, {}];
                });

            $httpBackend.whenPOST(/translations(\/\d*(\/\d*)).*mock.*/, undefined, ['essenceId', 'entityId'])
                .respond(function (method, url, data) {
                    $log.debug('mocking ' + method + ' :' + url);
                    var body = JSON.parse(data);
                    $log.debug(body);
//do stuff
                    return [200, 'ok', {}];
                });

            $httpBackend.whenPUT(/translations(\/\d*(\/\d*)).*mock.*/, undefined, ['essenceId', 'entityId'])
                .respond(function (method, url, data) {
                    $log.debug('mocking ' + method + ' :' + url);
                    var body = JSON.parse(data);
                    $log.debug(body);
//do stuff
                    return [200, 'ok', {}];
                });
        };
    });
