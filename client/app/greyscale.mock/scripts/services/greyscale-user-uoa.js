/**
 * Created by igi on 21.01.16.
 */
'use strict';
angular.module('greyscale.mock')
    .factory('greyscaleUserUoaMock', function ($httpBackend, $log, _, greyscaleUtilsSrv) {

        return function () {
            var userUoa = [{
                userId: 1001,
                uoaId: 1
            }, {
                userId: 1002,
                uoaId: 1
            }, {
                userId: 1003,
                uoaId: 1
            }, {
                userId: 1001,
                uoaId: 15
            }];

            $httpBackend.whenGET(/user-uoa\?.*mock/)
                .respond(function (method, url) {
                    $log.debug('mocking ' + method + ':' + url);
                    var pUrl = greyscaleUtilsSrv.parseURL(url);
                    var res = userUoa;
                    if (pUrl.params.userId) {
                        var ids = pUrl.params.userId.split('|');
                        res = _.filter(userUoa, function (uoa) {
                            return _.includes(ids, uoa.userId + '');
                        });
                    }
                    return [200, res, {}];
                });

            $httpBackend.whenPOST(/user-uoa\?.*mock/)
                .respond(function (method, url, data) {
                    $log.debug('mocking ' + method + ':' + url);
                    $log.debug(data);

                    for (var d = 0; d < data.length; d++) {
                        if (data[d] && !_.find(userUoa, data[d])) {
                            userUoa.push(userUoa, data[d]);
                        }
                    }
                    return [200, userUoa, {}];
                });

            $httpBackend.whenDELETE(/user-uoa\?.*mock/)
                .respond(function (method, url, data) {
                    $log.debug('mocking ' + method + ':' + url);
                    $log.debug(data);

                    for (var d = 0; d < data.length; d++) {
                        if (data[d]) {
                            _.remove(userUoa, data[d]);
                        }
                    }
                    return [200, userUoa, {}];
                });
        };
    });
