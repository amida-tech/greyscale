/**
 * Created by vkopytov on 21.12.15.
 *
 * @ngdoc function
 * @name greyscaleApp.controller:SurveyCtrl
 * @description
 * # SurveyCtrl
 * Controller of the greyscaleApp
 */

'use strict';

angular.module('greyscaleApp').controller('SurveyCtrl', function ($scope, greyscaleSurveysTbl) {

    $scope.model = {
        surveys: greyscaleSurveysTbl
    };
});
