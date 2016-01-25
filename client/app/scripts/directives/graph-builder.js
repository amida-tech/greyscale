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
                    { 'country': 'United States', 'value': 'B', 'score': 20 },
                    { 'country': 'Canada', 'value': 'B', 'score': 21 },
                    { 'country': 'Australia', 'value': 'B', 'score': 22 },
                    { 'country': 'United Kingdom', 'value': 'A', 'score': 23 },
                    { 'country': 'Mexico', 'value': 'C', 'score': 24 },
                    { 'country': 'Argentina', 'value': 'C', 'score': 25 }               
                ];
                
                /*
                 * Service calls
                 */
                greyscaleSurveySrv.list().then(function (data) {
                    scope.surveys = data;
                });

                /*
                 * Plotly data generation functions
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
                    
                    // The score for each bucket becomes the avage of the y-values
                    _.forEach(groups, function (g, key) {
                        x.push(key);
                        var tot = 0
                        _.forEach(g, function(val) {
                            tot += val[yVal];
                        });
                        y.push(tot / g.length);
                    });
                    
                    // Sort the arrays dependently,
                    // and return in the Plotly data format.
                    return sortAndPackData(x, y);
                }
                
                function generateDataHistogram(data, xVal) {
                    var x = [];
                    var y = [];

                    // Group the data into x-axis value buckets
                    var groups = _.groupBy(data, xVal);

                    // Count the number of entries for each x-axis bucket
                    _.forEach(groups, function (g, key) {
                        x.push(key);
                        y.push(g.length);
                    });
                        
                    // Sort the arrays dependently,
                    // and return in the Plotly data format.
                    return sortAndPackData(x, y);
                }
                
                function sortAndPackData(x, y) {
                    var sorted = sortArraysDependent(x, y);           
                    return packData(sorted);
                }
                
                function sortArraysDependent(x, y) {
                    var zipped = _.zip(x, y);
                    var sorted = _.sortBy(zipped, function (a) {
                        return a[0];
                    });
                    var unzipped = _.unzip(sorted);
                    return [unzipped[0], unzipped[1]];
                }
                
                function packData(sortedData) {
                    return [{
                        'x': sortedData[0],
                        'y': sortedData[1],
                    }];
                }
                
                scope.drawGraph = function () {
                    
                    // format the data for the type of graph being used
                    var graphData;
                    switch (scope.graphY) {
                        case "Count":
                            graphData = generateDataHistogram(scope.data, scope.graphX);
                            break;
                        default:
                            graphData = generateData(scope.data, scope.graphX, scope.graphY);
                            break;
                    }

                    // add Plotly attributed for the type of graph being used
                    switch (scope.graphType) {
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
                    console.log(graphData);
                    Plotly.newPlot('viz', graphData, layout);
                };

            }
        };
    });
