'use strict';

describe('greyscaleProfileSrv:', function () {

    beforeEach(angular.mock.module('greyscaleApp'));

    // Prevent flush issues with state transitions
    // http://stackoverflow.com/questions/23655307/ui-router-interfers-with-httpbackend-unit-test-angular-js/23670198#23670198
    beforeEach(module(function ($urlRouterProvider) {
        $urlRouterProvider.deferIntercept();
    }));

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

    });

    describe('getAccessLevelMask', function () {

        it('should get the default acessLevel', function () {
            expect(greyscaleProfileSrv.getAccessLevelMask()).toBe(0x0001);
        });

    });

});
