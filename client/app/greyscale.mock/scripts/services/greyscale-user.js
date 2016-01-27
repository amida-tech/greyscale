/**
 * Created by igi on 22.01.16.
 */
'use strict';
angular.module('greyscale.mock')
    .factory('greyscaleUserMock', function ($log, $httpBackend, greyscaleUtilsSrv) {
        return function () {
            $httpBackend.whenGET(/users\?.*mock.*/).respond(function (mtd, url) {
                $log.debug('mocking ' + url);
                var resp = [];
                var parsedUrl = greyscaleUtilsSrv.parseURL(url);
                for (var u = 0; u < 15; u++) {
                    resp.push({
                        roleID: 2,
                        id: u + 1001,
                        email: 'user-' + (u + 1001) + '@mocked',
                        firstName: 'test user ' + (u + 1001),
                        lastName: 'mocked',
                        mobile: null,
                        birthday: new Date().toISOString(),
                        resetPasswordToken: null,
                        resetPasswordExpires: null,
                        created: new Date().toISOString(),
                        isActive: true,
                        organizationId: parsedUrl.params.organizationId || 777
                    });
                }
                return [200, resp, {}];
            });
        };
    });
