/**
 * Created by igi on 22.01.16.
 */
'use strict';
angular.module('greyscale.mock')
    .factory('greyscaleUoaMock', function ($log, $httpBackend, greyscaleUtilsSrv) {

        return function () {
            $httpBackend.whenGET(/uoas.*mock.*/).respond(function (m, url) {
                var urlParts = greyscaleUtilsSrv.parseURL(url);
                $log.debug('mocking ' + url);
                var resp = [],
                    uoaType = 'public',
                    idStart = 1;
                if (urlParts.params.status === '2') {
                    uoaType = 'private';
                    idStart = 11;
                }
                uoaType += ' ';
                for (var i = 0; i < 10; i++) {
                    resp.push({
                        id: idStart + i,
                        name: uoaType + (i + idStart),
                        description: 'Mocked UOA ' + uoaType + i
                    });
                }
                return [200, resp, {}];
            });
        };
    });
