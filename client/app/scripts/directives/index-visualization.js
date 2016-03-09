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
                    console.log("applyFilters called with");
                    console.log(data);

                    if (!data) { callback(data); }

                    //Handles case when data has not been narrowed, only variable changed
                    //length==0 because topicSelected ng-multi-select not registering as dirty (TODO)
                    if (scope.filterForm.topicSelected.length === 0) {
                        callback(data);
                    } else {
                        var filteredVizData = [];
                        data.forEach(function (row) {
                            console.log("considering row");
                            if (scope.filterForm.topicSelected) {
                                scope.filterForm.topicSelected.forEach(function (topic) {
                                    if (topic.id === row.id) {
                                        filteredVizData.push(row);
                                    }
                                });
                            }
                        });
                        console.log("returning");
                        console.log(filteredVizData);
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

                function renderComparative(plotData, index) {
                    console.log(plotData);
                    var labels = _.pluck(plotData, 'name');

                    // average across all selected topics
                    var values = _.pluck(_.pluck(plotData, index.collection), index.id);
                    var average = _.reduce(values, function (m, n) { return m + n; }, 0) / values.length;
                    console.log(labels);
                    console.log(_.times(labels.length, function() { return average; }));

                    var comparedColor = 'rgb(164, 194, 244)';
                    var selectedColor = 'rgb(255, 217, 102)';
                    var averageColor = 'rgb(234, 153, 153)';
                    var graphData = [{
                        type: 'bar',
                        x: labels,
                        y: values,
                        marker: {
                            color: _.map(plotData, function (datum) {
                                if (datum.id === scope.filterForm.comparativeTopic.id) {
                                    return selectedColor;
                                } else {
                                    return comparedColor;
                                }
                            })
                        },
                        showlegend: false
                    }, {
                        type: 'scatter',
                        x: labels,
                        y: _.times(labels.length, function() { return average; }),
                        name: 'Regional Average',
                        showlegend: true,
                        marker: {
                            color: averageColor
                        },
                        mode:  'lines',
                        line: {
                            dash: 'dot',
                            width: 4
                        }
                    }];

                    var layout = {
                        title: index.title,
                        width: 700,
                        height: 700,
                        hovermode: false
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
                    } else if (scope.filterForm.visualizationType === 'map') {
                        renderMap(plotData, index);
                    } else if (scope.filterForm.visualizationType === 'comparative') {
                        renderComparative(plotData, index);
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
