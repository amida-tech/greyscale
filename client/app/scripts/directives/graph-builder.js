/**
 * Created by jsachs on 21.01.16.
 */
'use strict';

angular
    .module('greyscaleApp')
    .directive('graphBuilder', function ($window, greyscaleSurveySrv, _) {
        return {
            templateUrl: 'views/directives/graph-builder.html',
            restrict: 'E',
            link: function (scope, elem, attr) {

                /*
                 * Data variables
                 */
                var data = [
                    { 'country': 'United States', 'value': 'B' },
                    { 'country': 'Canada', 'value': 'B' },
                    { 'country': 'Australia', 'value': 'B' },
                    { 'country': 'United Kingdom', 'value': 'A' },
                    { 'country': 'Mexico', 'value': 'C' },
                    { 'country': 'Argentina', 'value': 'C' }               
                ];
                
                /*
                 * Service calls
                 */
                greyscaleSurveySrv.list().then(function (data) {
                    scope.surveys = data;
                });

                /*
                 * D3 functions
                 */
                scope.drawGraph = function(graphType) {
                    
                    function generateData(data, xVal, yVal) {
                        var x = [];
                        var y = [];
                        
                        var groups = _.groupBy(data, xVal);

                        _.forEach(groups, function(g, key) {
                            x.push(key);
                            y.push(g.length);
                        });
                        
                        // Sort the arrays dependently
                        var zipped = _.zip(x, y);
                        var sorted = _.sortBy(zipped, function(a) {
                            return a[0];
                        });
                        var unzipped = _.unzip(sorted);
                        
                        return [{
                            'x': unzipped[0],
                            'y': unzipped[1],
                        }];
                    }
                    
                    var graphData = generateData(data, 'value', 'country');

                    switch(graphType) {
                        case "line":
                            graphData[0].type = 'scatter';
                            break;
                        case "bar":
                            graphData[0].type = 'bar';
                            break;
                        default:
                            graphData[0].type = 'bar';
                            break;     
                    }

                    Plotly.newPlot('viz', graphData);
                }

            }
        };
    });
