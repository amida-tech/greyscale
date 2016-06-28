/**
 * Created by igi on 28.06.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('gsCoAnswers', function(){
        return {
            restrict: 'A', 
            scope: {
                field: '='
            },
            templateUrl: 'views/directives/gs-co-answers.html'
        };
    });
