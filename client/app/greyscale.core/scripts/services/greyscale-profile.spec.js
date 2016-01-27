'use strict';

describe('greyscaleProfileSrv:', function () {

    beforeEach(angular.mock.module('greyscaleApp'));

    var greyscaleProfileSrv,
        httpBackend;

    beforeEach(angular.mock.inject(function (_greyscaleProfileSrv_, $httpBackend) {
        greyscaleProfileSrv = _greyscaleProfileSrv_;
        httpBackend = $httpBackend;
    }));

    beforeEach(function () {
        httpBackend.expectGET('http://localhost:3005/local/v0.2/roles').respond(function (mtd, url) {
            var resp = [{
                id: 6,
                roleId: 3,
                userId: 110,
                essenceId: 4,
                entityId: 1
            }];
            return [200, resp];
        });

        httpBackend.expectGET(/views\/.*/);

        httpBackend.flush();
    });

    afterEach(function () {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
        httpBackend.resetExpectations();
    });

    describe('getProfile', function () {

        it('should reject if not logged in', function () {
            greyscaleProfileSrv.getProfile()
                .then(function () {})
                .catch(function (err) {
                    expect(err).toBe('not logged in');
                });
        });

        it('should return a user', function () {
            greyscaleProfileSrv.getProfile()
                .then(function (user) {
                    expect(user).toBe(jasmine.anything());
                });
        });

        it('should set the accessLevel', function () {
            greyscaleProfileSrv.getProfile()
                .then(function (user) {
                    greyscaleProfileSrv.getAccessLevelMask()
                        .then(function (mask) {
                            expect(mask).toBe(0x0002);
                        });
                });
        });

    });

    // describe('_setAccessLevel');

    describe('getAccessLevelMask', function () {

        it('should get the default acessLevel', function () {
            greyscaleProfileSrv.getAccessLevelMask()
                .then(function (mask) {
                    expect(mask).toBe(0x0001);
                });
            httpBackend.flush();
        });

    });

    describe('login', function () {

        it('should work', function () {
            greyscaleProfileSrv.login()
                .then(function (user) {
                    expect(user).toBe(jasmine.anything());
                });

        });

    });

    describe('logout', function () {

        it('should remove access level');

    });

});
