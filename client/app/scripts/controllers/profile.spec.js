'use strict';

describe('ProfileCtrl:', function () {

    beforeEach(angular.mock.module('greyscaleApp'));

    var $controller;

    beforeEach(angular.mock.inject(function (_$controller_) {
        $controller = _$controller_;
    }));

    describe('scope.org initializes correctly:', function () {

        it('loaded === true', function () {
            var $scope = {};
            var controller = $controller('ProfileCtrl', {
                $scope: $scope
            });

            expect($scope.org.loaded).toBe(true);
        });

        it('$scope.user exists', function () {
            var $scope = {};
            var controller = $controller('ProfileCtrl', {
                $scope: $scope
            });

            expect($scope.user).toEqual(jasmine.anything());
        });

    });

    describe('editProfile', function () {

        it('should return a response when editing the profile', function () {
            var $scope = {
                user: {
                    roleID: 1,
                    id: 112,
                    email: 'no@mail.net',
                    firstName: 'test',
                    lastName: 'admin'
                }
            };

            var controller = $controller('ProfileCtrl', {
                $scope: $scope
            });

            $scope.editProfile()
                .then(function (res) {
                    console.log(res);
                })
                .catch(function (e) {
                    console.log(e);
                });
        });

    });

    describe('editOrg', function () {

        it('should return a response when editing the organization', function () {
            var $scope = {};
            var controller = $controller('ProfileCtrl', {
                $scope: $scope
            });

            $scope.editOrg()
                .then(function (res) {
                    console.log(res);
                })
                .catch(function (e) {
                    console.log(e);
                });
        });

    });

});
