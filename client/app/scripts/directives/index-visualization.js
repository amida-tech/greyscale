'use strict';

angular.module('greyscaleApp')
    .directive('indexViz', function ($window, $http, greyscaleSurveyApi, greyscaleProductApi) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/index-visualization.html',
            //no isolate scope for data binding, all data moved from controller to directive
            link: function (scope, element, attrs) {
                scope.filterForm.topicSelected = [];
                scope.filterForm.visualizationType = 'map';

                //Load products
                greyscaleProductApi.getList().then(function (products) {
                    scope.products = products;
                });

                //Load data dump on product selection
                scope.$watch('filterForm.productSelected', function (product) {
                    if (!product || _.isEmpty(product)) {
                      scope.vizData = null;
                      return null;
                    }

                    greyscaleProductApi.product(product.id).indexes().then(function (vizData) {
                        scope.vizData = vizData.agg;
                        scope.topics = vizData.agg.map(function (row) {
                            return {
                                name: row.name,
                                ISO2: row.ISO2,
                                id: row.id
                            };
                        });

                        //Store questions/indexes/subindexes
                        scope.indexes = [];
                        ['questions', 'subindexes', 'indexes'].forEach(function (collection) {
                            for (var id in vizData[collection]) {
                                scope.indexes.push({
                                    collection: collection,
                                    title: vizData[collection][id].title,
                                    id: vizData[collection][id].id
                                });
                            }
                        });
                    });
                });
                
                function applyFilters(data, callback) {
                    if (!scope.vizData) { callback(scope.vizData); }

                    //Handles case when data has not been narrowed, only variable changed
                    //length==0 because topicSelected ng-multi-select not registering as dirty (TODO)
                    if (scope.filterForm.topicSelected.length === 0) {
                        callback(scope.vizData);
                    } else {
                        var filteredVizData = [];
                        scope.vizData.forEach(function (row) {
                            if (scope.filterForm.topicSelected) {
                                scope.filterForm.topicSelected.forEach(function (topic) {
                                    if (topic.ISO2 === row.ISO2) {
                                        filteredVizData.push(row);
                                    }
                                });
                            }
                        });
                        callback(filteredVizData);
                    }
                }
                
                function renderMap(plotData, index) {
                    var mapData = [{
                        type: 'choropleth',
                        locationmode: 'country names',
                        locations: _.pluck(plotData, 'name'),
                        z: _.pluck(_.pluck(plotData, index.collection), index.id),
                        text: _.pluck(plotData, 'name'),
                        autocolorscale: true,
                        colorbar: {
                            title: 'Value',
                            thickness: 0.75,
                            len: 0.75,
                            xpad: 30
                        }
                    }];

                    var layout = {
                        title: index.title,
                        geo: {
                            projection: {
                                type: 'mercator'
                            },
                            resolution: '50',
                            showframe: false,
                            showcoastlines: true,
                            scope: 'world'
                        },
                        width: 700,
                        height: 700
                    };
                    Plotly.newPlot('viz', mapData, layout, {
                        showLink: false
                    });
                }

                function renderBarGraph(plotData, index) {
                    //Sorted bar graph
                    plotData = _.sortBy(plotData, function (row) {
                        return row[index.collection][index.id];
                    });

                    var graphData = [{
                        type: 'bar',
                        x: _.pluck(plotData, 'name'),
                        y: _.pluck(_.pluck(plotData, index.collection), index.id)
                    }];

                    var layout = {
                        title: index.title,
                        width: 700,
                        height: 700
                    };
                    Plotly.newPlot('viz', graphData, layout, {
                        showLink: false
                    });
                }

                function renderVisualization(plotData) {
                    var index = scope.filterForm.indexSelected;

                    //Remove plot
                    if (!index || _.isEmpty(index) || !plotData) {
                        $('#viz').html('');
                        return null;
                    }

                    if (scope.filterForm.visualizationType === 'graph') {
                        renderBarGraph(plotData, index);
                    } else {
                        renderMap(plotData, index);
                    }
                }

                scope.drawVisualization = function () {
                    if (scope.filterForm.$valid) {
                        applyFilters(scope.vizData, function (result) {
                            renderVisualization(result);
                        });
                    }
                };

                scope.resetFilters = function () {
                    scope.filterForm.productSelected = {};
                    scope.filterForm.topicSelected = [];
                    scope.filterForm.indexSelected = {};
                    scope.filterForm.visualizationType = 'map';
                    scope.filterForm.$setPristine();
                    scope.drawVisualization();
                };

                //Validation of topics ng-multi-select dropdown
                scope.$watch('filterForm.topicSelected', function (newVal, oldVal) {
                    if (newVal.length <= 0) {
                        $('.topicSelectedState').removeClass('ng-dirty');
                    } else {
                        $('.topicSelectedState').addClass('ng-dirty');
                    }
                });
            }
        };
    });
