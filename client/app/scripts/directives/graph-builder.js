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

                scope.graphTypes = [
                  "Bar",
                  "Line",
                  "Scatter",
                ];

                /*
                 * Data variables
                 */
                scope.data = [
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
                 * Plotly functions
                 */
                var layout = {
                    autosize: true,
                    // width: 500,
                    // height: 500,
                    margin: {
                        l: 50,
                        r: 50,
                        b: 100,
                        t: 100,
                        pad: 4
                    },
                };
                
                function generateData(data, xVal, yVal) {
                    var x = [];
                    var y = [];

                    // Group the data into x-axis value buckets
                    var groups = _.groupBy(data, xVal);

                    // Count the number of entries for each x-axis bucket
                    _.forEach(groups, function (g, key) {
                        x.push(key);
                        y.push(g.length);
                    });
                        
                    // Sort the arrays dependently
                    var zipped = _.zip(x, y);
                    var sorted = _.sortBy(zipped, function (a) {
                        return a[0];
                    });
                    var unzipped = _.unzip(sorted);

                    return [{
                        'x': unzipped[0],
                        'y': unzipped[1],
                    }];
                }
                
                scope.drawGraph = function (graphType) {

                    var graphData = generateData(scope.data, scope.graphX, scope.graphY);

                    switch (graphType) {
                        case "Scatter":
                            graphData[0].type = 'scatter';
                            graphData[0].mode = 'markers';
                            break;
                        case "Line":
                            graphData[0].type = 'scatter';
                            break;
                        case "Bar":
                            graphData[0].type = 'bar';
                            break;
                        default:
                            graphData[0].type = 'bar';
                            break;
                    }

                    Plotly.newPlot('viz', graphData, layout);
                };

            }
        };
    });
