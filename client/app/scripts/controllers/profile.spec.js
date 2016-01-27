'use strict';

describe('ProfileCtrl:', function () {

    beforeEach(angular.mock.module('greyscaleApp'));

    var controller,
        $controller,
        $scope;

    beforeEach(angular.mock.inject(function (_$controller_) {
        $controller = _$controller_;
    }));

    beforeEach(function () {
        $scope = {};
        controller = $controller('ProfileCtrl', {
            $scope: $scope
        });
    });

    describe('scope.org initializes correctly:', function () {

        it('loaded === true', function () {
            expect($scope.org.loaded).toBe(true);
        });

    });

    describe('editProfile', function () {

        it('should be in $scope', function () {
            expect($scope.editProfile).toEqual(jasmine.anything());
        });

    });

    describe('editOrg', function () {

        it('should be in $scope', function () {
            expect($scope.editOrg).toEqual(jasmine.anything());
        });

    });

});
