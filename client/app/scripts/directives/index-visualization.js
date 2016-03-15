'use strict';

angular.module('greyscaleApp')
    .directive('indexViz', function ($window, $http, $stateParams, $q, Organization, greyscaleProductApi, greyscaleVisualizationApi, greyscaleOrganizationApi) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/index-visualization.html',
            //no isolate scope for data binding, all data moved from controller to directive
            link: function (scope, element, attrs) {
                scope.filterForm.topicSelected = [];
                scope.filterForm.visualizationType = 'map';
                scope.loadingConfig = false;
                scope.savedVisualization = false;
                scope.visualizationTitle = null;
                scope.topics = [];

                Organization.$watch(scope, function () {
                    _loadProducts().then(function () {
                        if ($stateParams.visualizationId) {
                            scope.savedVisualization = true;
                            _loadVisualization($stateParams.visualizationId);
                        }
                    });
                });

                //Load products
                function _loadProducts() {
                    return greyscaleOrganizationApi.products(Organization.id).then(function (products) {
                        console.log(products);
                        scope.products = products;
                    });
                }
                //Load data dump on product selection
                scope.$watch('filterForm.productSelected', function (product) {
                    if (!scope.loadingConfig) {
                        _loadData(product);
                    }
                });

                function _loadData(product) {
                    if (!product || _.isEmpty(product)) {
                        scope.vizData = null;
                        return $q.when(null);
                    }

                    return greyscaleProductApi.product(product.id).indexes().then(function (vizData) {
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
                }

                function applyFilters(data, callback) {
                    if (!data) {
                        callback(data);
                    }

                    //Handles case when data has not been narrowed, only variable changed
                    //length==0 because topicSelected ng-multi-select not registering as dirty (TODO)
                    if (scope.filterForm.topicSelected.length === 0) {
                        callback(data);
                    } else {
                        var filteredVizData = [];
                        data.forEach(function (row) {
                            if (scope.filterForm.topicSelected) {
                                scope.filterForm.topicSelected.forEach(function (topic) {
                                    if (topic.id === row.id) {
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
                            title: index.title,
                            thickness: 0.75,
                            len: 0.75,
                            xpad: 30
                        }
                    }];

                    var layout = {
                        title: '\'' + index.title + '\' Choropleth Map',
                        geo: {
                            projection: {
                                type: 'mercator'
                            },
                            resolution: '50',
                            showframe: false,
                            showcoastlines: true,
                            scope: 'world'
                        },
                        width: $('#viz').width() - 20,
                        height: 500
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
                        y: _.pluck(_.pluck(plotData, index.collection), index.id),
                        marker: {
                            color: 'rgb(164, 194, 244)'
                        }
                    }];

                    var layout = {
                        title: '\'' + index.title + '\' Ranked Bar Graph',
                        annotations: plotData.map(function (datum, i) {
                            return {
                                x: datum.name,
                                y: datum[index.collection][index.id],
                                text: '#' + (plotData.length - i),
                                xanchor: 'center',
                                yanchor: 'bottom',
                                showarrow: false
                            };
                        }),
                        xaxis: {
                            title: 'Target'
                        },
                        yaxis: {
                            title: index.title
                        },
                        width: $('#viz').width() - 20,
                        height: 500
                    };
                    Plotly.newPlot('viz', graphData, layout, {
                        showLink: false
                    });
                }

                function renderComparative(plotData, index) {
                    var labels = _.pluck(plotData, 'name');

                    // average across all selected topics
                    var values = _.pluck(_.pluck(plotData, index.collection), index.id);
                    var average = _.reduce(values, function (m, n) {
                        return m + n;
                    }, 0) / values.length;

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
                        showlegend: false,
                        hoverinfo: 'x+y'
                    }, {
                        type: 'scatter',
                        x: labels,
                        y: _.times(labels.length, function () {
                            return average;
                        }),
                        name: 'Regional Average',
                        showlegend: true,
                        marker: {
                            color: averageColor
                        },
                        mode: 'lines',
                        line: {
                            dash: 'dot',
                            width: 4
                        },
                        hoverinfo: 'none'
                    }];

                    var layout = {
                        title: '\'' + index.title + '\' Comparative Bar Graph',
                        height: 500,
                        width: $('#viz').width() - 20,
                        xaxis: {
                            title: 'Target'
                        },
                        yaxis: {
                            title: index.title
                        }
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
                    // isteven-multi-select requires us to deselect topics by setting
                    // selected attribute on input model
                    scope.topics = scope.topics.map(function (topic) {
                        topic.selected = false;
                        return topic;
                    });
                    scope.filterForm.indexSelected = {};
                    scope.filterForm.visualizationType = 'map';
                    scope.filterForm.comparativeTopic = {};
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

                function _getConfiguration() {
                    console.log(scope.filterForm);
                    var config = {
                        productId: scope.filterForm.productSelected.id,
                        topicIds: scope.filterForm.topicSelected.map(function (topic) {
                            return topic.id;
                        }),
                        indexCollection: scope.filterForm.indexSelected.collection,
                        indexId: scope.filterForm.indexSelected.id,
                        visualizationType: scope.filterForm.visualizationType,
                        comparativeTopicId: scope.filterForm.comparativeTopic.id,
                        title: scope.visualizationTitle
                    };

                    return config;
                }

                function _loadConfiguration(config) {
                    scope.loadingConfig = true;
                    scope.visualizationTitle = config.title;
                    scope.filterForm.productSelected = _.findWhere(scope.products, {
                        id: config.productId
                    }) || {};
                    return _loadData(scope.filterForm.productSelected).then(function () {
                        // isteven-multi-select requires us to set selection by modifying
                        // input model and setting 'selected'
                        scope.filterForm.topicSelected = scope.topics.map(function (topic) {
                            topic.selected = _.contains(config.topicIds, topic.id);
                            return topic;
                        });

                        scope.filterForm.indexSelected = _.findWhere(scope.indexes, {
                            id: config.indexId,
                            collection: config.indexCollection
                        }) || {};
                        scope.filterForm.visualizationType = config.visualizationType || 'map';
                        scope.filterForm.comparativeTopic = _.findWhere(scope.topics, {
                            id: config.comparativeTopicId
                        }) || {};

                        scope.loadingConfig = false;
                        scope.drawVisualization();
                    });
                }

                function _loadVisualization(visualizationId) {
                    scope.visualizationId = $stateParams.visualizationId;

                    return greyscaleVisualizationApi(Organization.id).get(visualizationId).then(function (config) {
                        scope.model.title = config.title;
                        return _loadConfiguration(config);
                    });
                }

                scope.saveVisualization = function () {
                    return greyscaleVisualizationApi(Organization.id).update(scope.visualizationId, _getConfiguration());
                };
            }
        };
    });
