/**
 * Created by igi on 25.01.16.
 */
'use strict';
angular.module('greyscale.mock')
    .factory('greyscaleMessagesMock', function ($httpBackend, greyscaleUtilsSrv, $log, greyscaleGlobals) {
        var _messages = [];

        for (var m = 0; m < 7; m++) {
            _messages.push({
                id: m,
                sent: new Date().toUTCString(),
                read: null,
                flagged: true,
                from: 1,
                to: 2,
                body: greyscaleGlobals.loremIpsum
            });
        }

        var _threads = [{
            id: 0,
            title: 'lorem ipsum',
            messages: _messages
        }];

        return function () {
            $httpBackend.whenGET(/messages.*mock.*\/thread/).respond(function (method, url) {

            });
            $httpBackend.whenGET(/messages.*mock.*/).respond(function (method, url) {
                $log.debug('mocking ' + method + ' :' + url);
                return [200, _messages, {}];
            });

            $httpBackend.whenPOST(/messages.*mock.*/).respond(function (method, url, data) {
                $log.debug('mocking ' + method + ' :' + url);
                var body = JSON.parse(data);
                $log.debug(body);

                body.created = new Date().toUTCString();
                body.read = null;
                body.id = _messages.length;

                _messages.push(body);

                return [200, 'ok', {}];
            });

            $httpBackend.whenPUT(/messages.*mock.*/).respond(function (method, url, data) {
                $log.debug('mocking ' + method + ' :' + url);
                var body = JSON.parse(data);
                $log.debug(body);

                if (_messages[body.id]) {
                    angular.extend(_messages[body.id], body);
                }
                return [200, 'ok', {}];
            });
        };
    });
