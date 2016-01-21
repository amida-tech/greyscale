/**
 * Created by jsachs on 21.01.16.
 */
'use strict';

angular
    .module('greyscaleApp')
    .directive('graphBuilder', function (greyscaleSurveySrv) {
        return {
            templateUrl: 'views/directives/graph-builder.html',
            restrict: 'E',
            link: function (scope, elem, attr) {
                
                greyscaleSurveySrv.list().then(function(data) {
                    
                    scope.surveys = data;
                    
                });
                
            }
        };
    });
