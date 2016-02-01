/**
 * Created by igi on 29.01.16.
 */
'use strict';
angular.module('greyscale.mock')
    .factory('greyscaleTranslationMock', function ($httpBackend, greyscaleUtilsSrv, $log, $filter) {
        var _translations = [{
            'essenceId': 4,
            'entityId': 1,
            'field': 'title',
            'langId': 2,
            'value': 'Яблоко'
        }, {
            'essenceId': 4,
            'entityId': 1,
            'field': 'title',
            'langId': 1,
            'value': 'Apple'
        }, {
            'essenceId': 4,
            'entityId': 2,
            'field': 'title',
            'langId': 2,
            'value': 'Арбуз'
        }];

        var expr = /\/translations(\/(\d+)(\/(\d+))?)?.*mock.*/;

        return function () {
            $httpBackend.whenGET(expr)
                .respond(function (method, url) {
                    var param = expr.exec(url);
                    var urlParts = greyscaleUtilsSrv.parseURL(url);
                    var filter = urlParts.params || {};
                    var res = _translations;

                    filter = _.pick(filter, ['essenceId', 'entityId', 'field', 'langId', 'value']);

                    if (param[2]) {
                        filter.essenceId = param[2];
                        if (param[4]) {
                            filter.entityId = param[4];
                        }
                    }
                    if (filter) {
                        res = $filter('filter')(res, filter);
                    }
                    return [200, res, {}];
                });

            $httpBackend.whenPOST(expr)
                .respond(function (method, url, data) {
                    $log.debug('mocking ' + method + ' :' + url);
                    var body = JSON.parse(data);
                    var resp = [200, 'ok', {}];
                    var tInd = _.findIndex(_translations, _.pick(body, ['essenceId', 'entityId', 'field', 'langId']));
                    if (tInd < 0) {
                        _translations.push(_.pick(body, ['essenceId', 'entityId', 'field', 'langId', 'value']));
                    } else {
                        resp = [400, 'adding translation exists', {}];
                    }
                    $log.debug(body, tInd, _translations);
                    return resp;
                });

            $httpBackend.whenPUT(expr)
                .respond(function (method, url, data) {
                    $log.debug('mocking ' + method + ' :' + url);
                    var body = JSON.parse(data);
                    var resp = [200, 'ok', {}];
                    var tInd = _.findIndex(_translations, _.pick(body, ['essenceId', 'entityId', 'field', 'langId']));
                    if (tInd >= 0) {
                        _translations[tInd] = _.pick(body, ['essenceId', 'entityId', 'field', 'langId', 'value']);
                    } else {
                        resp = [400, 'translation not found', {}];
                    }
                    $log.debug(body, tInd, _translations);
                    return resp;
                });

            $httpBackend.whenDELETE(expr)
                .respond(function (method, url, data) {
                    $log.debug('mocking ' + method + ' :' + url);
                    var body = JSON.parse(data);
                    var resp = [200, 'ok', {}];
                    var tInd = _.findIndex(_translations, _.pick(body, ['essenceId', 'entityId', 'field', 'langId']));
                    if (tInd >= 0) {
                        _translations.splice(tInd, 1);
                    } else {
                        resp = [400, 'translation not found', {}];
                    }
                    $log.debug(body, tInd, _translations);
                    return resp;
                });
        };
    });
