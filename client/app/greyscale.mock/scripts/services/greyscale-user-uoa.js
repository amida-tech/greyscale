/**
 * Created by igi on 21.01.16.
 */
'use strict';
angular.module('greyscale.mock')
    .factory('greyscaleUserUoaMock', function ($httpBackend, $log) {
        return function () {
            $log.debug('mocking user-uoa requests');

            $httpBackend.whenGET(/.+user-uoa.*/)
                .respond(function (method, url, data) {
                    $log.debug(method, url, data);
                    return [200, [{
                        msg: 'testing user-uoa'
                    }], {}];
                });
        };
    });
