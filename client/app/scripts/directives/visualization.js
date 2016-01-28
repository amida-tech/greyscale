'use strict';

angular.module('greyscaleApp')
    .directive('mapViz', function ($window, $http, greyscaleSurveySrv) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/visualization.html',
            //no isolate scope for data binding, all data moved from controller to directive
            link: function (scope, element, attrs) {
                //Local variables for angular data digest cycle ($watch)
                var vizData = [];
                var filterForm = {};

                //Load geo coordinates and data
                $http.get('scripts/directives/resources/doingbiz_agg.json')
                    .success(function (vizData) {
                        scope.vizData = vizData;
                        console.log(scope.vizData);

                        var countrySet = new Set(); //account for same country/multi-year duplicates
                        vizData.agg.forEach(function (row) {
                            countrySet.add({
                                'name': row.country,
                                'isoa2': row.isoa2
                            });
                        });
                        scope.topics = [...countrySet];
                        console.log(scope.topics);
                    })
                    .error(function (err) {
                        console.log(err);
                    });

                //Mocked survey data --> look @ Mike's format
                scope.surveys = [{
                    'qid': '1234',
                    'text': 'question1'
                }, {
                    'qid': '5678',
                    'text': 'question2'
                }];

                scope.filterOptions = {
                    subtopics: [{
                        'id': '3333',
                        'name': 'Income'
                    }, {
                        'id': '424',
                        'name': 'Region' //allow for user-specified region mapping
                    }, {
                        'id': '111',
                        'name': 'Continent'
                    }],
                    continents: [{
                        'name': 'Africa',
                        'isoa2': 'AF'
                    }, {
                        'name': 'Europe',
                        'isoa2': 'EU'
                    }, {
                        'name': 'North America',
                        'isoa2': 'NA'
                    }, {
                        'name': 'Asia',
                        'isoa2': 'AS',
                    }, {
                        'name': 'South America',
                        'isoa2': 'SA'
                    }, {
                        'name': 'Australia',
                        'isoa2': 'AU'
                    }, {
                        'name': 'Antartica',
                        'isoa2': 'AQ'
                    }],
                    //TODO: pull official groupings (incomes+regions) from somewhere
                    incomeLevels: [{
                        'name': 'Low-income',
                        'countries': ['AF', 'DZ']
                    }, {
                        'name': 'Middle-income',
                        'countries': ['AZ', 'MX']
                    }, {
                        'name': 'High-income',
                        'countries': ['US', 'FR', 'DE']
                    }],
                    regions: []
                };

                // function parseQuery(){

                // }

                var filteredVizData = [];

                function applyFilters() {
                    console.log('APPLYING FILTERS');
                    if (scope.filterForm.$pristine) {
                        filteredVizData = vizData;
                        console.log('NO FILTERS SELECTED');
                    } else {
                        console.log('IN ELSE BLOCK, APPLYING FILTERS');
                        try {
                            vizData.forEach(function (row) {

                                if (filterForm.topicSelected.indexOf(row.country) > -1) {
                                    filteredVizData.push(row);
                                }

                                var category = filterForm.subtopicSelected.category;
                                switch (filterForm.subtopicSelected.subtopic.name) {
                                case 'Continent':
                                    if (row.continent === category.isoa2) {
                                        filteredVizData.push(row);
                                    }
                                    break;
                                case 'Income':
                                    if (checkIfInGroup('incomeLevels', row)) {
                                        filteredVizData.push(row);
                                    }
                                    break;
                                case 'Region':
                                    if (checkIfInGroup('region', row)) {
                                        filteredVizData.push(row);
                                    }
                                    break;
                                default:
                                    break;
                                }
                            });
                        } catch (e) {
                            console.log(e);
                        }
                    }
                    console.log(filteredVizData);
                }

                function checkIfInGroup(subtopic, row) {
                    var groupIds = [];
                    scope.filterOptions[subtopic].forEach(function (group) {
                        if (group === category) {
                            groupIds = group.countries;
                        }
                    });
                    return (groupIds.indexOf(row.isoa2) > -1);
                }

                function renderMap() {
                    applyFilters();
                    var rows = filteredVizData;

                    function unpackData(rows, key) {
                        return rows.map(function (row) {
                            return row[key];
                        });
                    }
                    var mapData = [{
                        type: 'choropleth',
                        locationmode: 'country names',
                        locations: unpackData(rows, 'country'),
                        z: unpackData(rows, 'rank'),
                        zmin: 1,
                        zmax: 189,
                        text: unpackData(rows, 'country'),
                        autocolorscale: true,
                        colorbar: {
                            title: 'Doing Business Rank',
                            //   thickness: 0.5,
                            len: 0.75,
                            tickmode: 'array',
                            tickvals: ['1', '50', '100', '150', '189'],
                            xpad: 30
                        }
                    }];

                    var layout = {
                        title: 'Doing Business Ranking - 2016',
                        geo: {
                            showframe: false,
                            showcoastlines: false,
                            projection: {
                                type: 'mercator'
                            }
                            //   resolution: '50',
                        },
                        width: 700,
                        height: 700, //weird gaps
                        // margin: {
                        //   l: 80,
                        //   r: 80,
                        //   t: 100,
                        //   b: 40
                        // }
                    };
                    Plotly.newPlot('mapViz', mapData, layout, {
                        showLink: false
                    });
                }

                scope.$watch('vizData', function (newVal, oldVal) {
                    vizData = newVal.agg;
                    renderMap();
                });

                scope.$watch('filterForm', function (newVal, oldVal) {
                    console.log(newVal);
                    filterForm = newVal;
                    renderMap();
                });
            }
        };
    });
