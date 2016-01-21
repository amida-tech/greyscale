/**
 * Created by igi on 21.01.16.
 */
'use strict';

angular.module('greyscale.mock',['ngMockE2E'])
    .run(function($httpBackend, greyscaleUserUoaMock){
        console.log('mocking...');

        greyscaleUserUoaMock();

        $httpBackend.whenGET(/.*/).passThrough();
        $httpBackend.whenPOST(/.*/).passThrough();
        $httpBackend.whenPUT(/.*/).passThrough();
        $httpBackend.whenDELETE(/.*/).passThrough();
    });
