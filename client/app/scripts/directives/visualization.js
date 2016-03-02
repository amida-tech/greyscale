'use strict';

angular.module('greyscaleApp')
    .directive('mapViz', function ($window, $http, greyscaleSurveyApi, greyscaleProductApi) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/visualization.html',
            //no isolate scope for data binding, all data moved from controller to directive
            link: function (scope, element, attrs) {
                scope.filterForm.topicSelected = [];

                //Load products
                greyscaleProductApi.getList().then(function (products) {
                    scope.products = products;
                });

                //Load data dump on product selection
                scope.$watch('filterForm.productSelected', function (product) {
                    if (!product) {
                      scope.vizData = [];
                      return null;
                    }

                    greyscaleProductApi.product(product.id).indexes().then(function (vizData) {
                        scope.vizData = vizData.agg;

                        //Store topics (UOAs)
                        var countrySet = new Set(); //account for same country/multi-year duplicates
                        vizData.agg.forEach(function (row) {
                            countrySet.add({
                                'name': row.name,
                                'ISO2': row.ISO2,
                                'id': row.id
                            });
                        });
                        scope.topics = [...countrySet];

                        //Store questions/indexes/subindexes
                        scope.indexes = [];
                        // TODO: use all UOAs to get keys
                        var uoa = vizData.agg[0];
                        if (uoa) {
                            for (var questionId in uoa.answers) {
                                scope.indexes.push({
                                    'collection': 'answers',
                                    'title': 'Question ' + questionId,
                                    'id': questionId
                                });
                            }
                            for (var subindexId in uoa.subindexes) {
                                scope.indexes.push({
                                    'collection': 'subindexes',
                                    'title': 'Subindex ' + subindexId,
                                    'id': subindexId
                                });
                            }
                            for (var indexId in uoa.indexes) {
                                scope.indexes.push({
                                    'collection': 'indexes',
                                    'title': 'Index ' + indexId,
                                    'id': indexId
                                });
                            }
                        }
                    });
                });
                
                function applyFilters(data, callback) {
                    //Handles case when data has not been narrowed, only variable changed
                    //length==0 because topicSelected ng-multi-select not registering as dirty (TODO)
                    if (scope.filterForm.topicSelected.length === 0) {
                        callback(scope.vizData);
                    } else {
                        var filteredVizData = [];
                        console.log(scope.vizData);
                        scope.vizData.forEach(function (row) {
                            if (scope.filterForm.topicSelected) {
                                scope.filterForm.topicSelected.forEach(function (topic) {
                                    if (topic.ISO2 === row.ISO2) {
                                        filteredVizData.push(row);
                                    }
                                });
                            }
                        });
                        console.log(filteredVizData);
                        callback(filteredVizData);
                    }
                }
                

                function getMapParams() {
                    //start with default
                    var params = {
                        graphTitle: 'Doing Business 2016',
                        scaleTitle: 'Rank',
                        geoScope: 'world',
                        showcoastlines: true
                    };
                    if (scope.filterForm.$pristine && scope.filterForm.topicSelected.length === 0) {
                        return params;
                    }
                    /*if (scope.filterForm.variableSelected) {
                        params.scaleTitle = (scope.variableSelected === 'rank') ? 'Rank' : 'DTF (frontier=100)';
                        params.graphTitle += ('- ' + params.scaleTitle);
                    }*/
                    /*
                    var topicArray = scope.filterForm.topicSelected;
                    if (topicArray.length !== 0) {
                        params.showcoastlines = true;
                        var topicNames = topicArray.map(function (topic) {
                            return topic.name;
                        });
                        params.graphTitle += ('\n' + topicNames.join());
                        //Single country - zoom into continent, usa scope built into Plotly
                        if (topicArray.length === 1) {
                            params.geoScope = (topicArray[0].isoa2 === 'US') ?
                                'usa' : scope.topicSelected.continent;
                            //Multiple countries - check from same continent
                        } else {
                            var continentCode = String(topicArray[0].continent);
                            var allSameContinent = topicArray.every(function (currentTopic) {
                                return String(currentTopic.continent) === continentCode;
                            });
                            if (allSameContinent) {
                                var fullContinentName = scope.filterOptions.continents.filter(function (cont) {
                                    return (cont.isoa2 === continentCode);
                                });
                                params.geoScope = fullContinentName[0].name.toLowerCase();
                            }
                        }
                    }*/
                    return params;
                }

                function renderMap(plotData) {
                    function unpackData(rows, key) {
                        return rows.map(function (row) {
                            return row[key];
                        });
                    }

                    var index = scope.filterForm.indexSelected;
                    if (!index) return null;

                    var mapParams = getMapParams();

                    var mapData = [{
                        type: 'choropleth',
                        locationmode: 'country names',
                        locations: unpackData(plotData, 'name'),
                        z: unpackData(unpackData(plotData, index.collection), index.id),
                        text: unpackData(plotData, 'name'),
                        autocolorscale: true,
                        colorbar: {
                            title: mapParams.scaleTitle,
                            thickness: 0.75,
                            len: 0.75,
                            xpad: 30
                        }
                    }];

                    var layout = {
                        title: mapParams.graphTitle, //Make subtitle from filter selection
                        geo: {
                            projection: {
                                type: 'mercator'
                            },
                            resolution: '50',
                            showframe: false,
                            showcoastlines: mapParams.showcoastlines,
                            scope: mapParams.geoScope
                        },
                        width: 700,
                        height: 700
                    };
                    Plotly.newPlot('mapViz', mapData, layout, {
                        showLink: false
                    });
                }

                scope.drawMap = function () {
                    if (scope.filterForm.$valid) {
                        applyFilters(scope.vizData, function (result) {
                            renderMap(result);
                        });
                    }
                };

                scope.resetFilters = function () {
                    scope.filterForm.productSelected = {};
                    // scope.filterForm.userSelected = '';
                    // scope.filterForm.variableSelected = 'rank';
                    scope.filterForm.topicSelected = [];
                    // scope.filterForm.subtopicSelected.subtopic = '';
                    // scope.filterForm.subtopicSelected.category = '';
                    // scope.filterForm.questionSelected = '';
                    scope.filterForm.indexSelected = {};
                    scope.filterForm.$setPristine();
                    scope.drawMap();
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
