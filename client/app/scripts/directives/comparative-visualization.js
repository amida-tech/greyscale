'use strict';

angular.module('greyscaleApp')
    .directive('comparativeViz', function ($window, $http, $stateParams, $q, Organization, greyscaleOrganizationApi, greyscaleModalsSrv, greyscaleProductApi) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/comparative-visualization.html',
            link: function (scope, element, attrs) {
                // PRODUCT SELECTION
                scope.products = [];

                //Load all products
                function _loadProducts() {
                    return greyscaleOrganizationApi.products(Organization.id).then(function (products) {
                        scope.allProducts = products;

                        // load test data
                        scope.products = JSON.parse('[{"product":{"id":48,"title":"2014 Ratings","description":"2014 Ratings","originalLangId":null,"projectId":56,"surveyId":108,"status":3,"langId":null},"index":{"id":3,"title":"Rating","divisor":1,"questionWeights":{"344":{"weight":1,"type":"value","aggregateType":null}},"subindexWeights":{}},"$$hashKey":"object:101","data":[{"id":14,"name":"Russia","ISO2":"","questions":{"344":4},"subindexes":{},"indexes":{"3":4},"x":10,"y":10,"val":4},{"id":60,"name":"Canada","ISO2":"CA","questions":{"344":3},"subindexes":{},"indexes":{"3":3},"x":45,"y":10,"val":3},{"id":16,"name":"USA","ISO2":"","questions":{"344":5},"subindexes":{},"indexes":{"3":5},"x":80,"y":10,"val":5},{"id":43,"name":"Belgium","ISO2":"BE","questions":{"344":2},"subindexes":{},"indexes":{"3":2},"x":115,"y":10,"val":2},{"id":45,"name":"Bulgaria","ISO2":"BG","questions":{"344":3},"subindexes":{},"indexes":{"3":3},"x":150,"y":10,"val":3},{"id":15,"name":"Germany","ISO2":"","questions":{"344":4},"subindexes":{},"indexes":{"3":4},"x":185,"y":10,"val":4},{"id":70,"name":"China","ISO2":"CN","questions":{"344":5},"subindexes":{},"indexes":{"3":5},"x":220,"y":10,"val":5}]},{"product":{"id":49,"title":"2015 Ratings","description":"2015 Ratings","originalLangId":null,"projectId":56,"surveyId":108,"status":3,"langId":null},"index":{"id":4,"title":"Rating","divisor":1,"questionWeights":{"344":{"weight":1,"type":"value","aggregateType":null}},"subindexWeights":{}},"$$hashKey":"object:127","data":[{"id":14,"name":"Russia","ISO2":"","questions":{"344":3},"subindexes":{},"indexes":{"4":3},"x":10,"y":45,"val":3},{"id":60,"name":"Canada","ISO2":"CA","questions":{"344":4},"subindexes":{},"indexes":{"4":4},"x":45,"y":45,"val":4},{"id":16,"name":"USA","ISO2":"","questions":{"344":4},"subindexes":{},"indexes":{"4":4},"x":80,"y":45,"val":4},{"id":43,"name":"Belgium","ISO2":"BE","questions":{"344":1},"subindexes":{},"indexes":{"4":1},"x":115,"y":45,"val":1},{"id":15,"name":"Germany","ISO2":"","questions":{"344":3},"subindexes":{},"indexes":{"4":3},"x":185,"y":45,"val":3},{"id":70,"name":"China","ISO2":"CN","questions":{"344":5},"subindexes":{},"indexes":{"4":5},"x":220,"y":45,"val":5},{"id":96,"name":"France","ISO2":"FR","questions":{"344":3},"subindexes":{},"indexes":{"4":3},"x":255,"y":45,"val":3}]},{"product":{"id":50,"title":"2016 Ratings","description":"2016 Ratings","originalLangId":null,"projectId":56,"surveyId":108,"status":3,"langId":null},"index":{"id":5,"title":"Rating","divisor":1,"questionWeights":{"344":{"weight":1,"type":"value","aggregateType":null}},"subindexWeights":{}}}]');
                        scope.productsTable.tableParams.reload();
                    });
                }
                Organization.$watch(scope, _loadProducts);

                //Table for product selection and index normalization
                scope.productsTable = {
                    title: 'Selected Products',
                    cols: [{
                        field: 'product.title',
                        title: 'Product',
                        cellClass: 'text-center'
                    }, {
                        field: 'index.title',
                        title: 'Index',
                        cellClass: 'text-center'
                    }, {
                        dataFormat: 'action',
                        actions: [{
                            icon: 'fa-trash',
                            handler: function (row) {
                                for (var i = 0; i < scope.products.length; i++) {
                                    if (scope.products[i].product.id === row.product.id && scope.products[i].index.id === row.index.id) {
                                        scope.products.splice(i, 1);
                                        break;
                                    }
                                }
                                scope.productsTable.tableParams.reload();
                            }
                        }]
                    }],
                    dataPromise: function () {
                        return $q.when(scope.products);
                    },
                    add: {
                        handler: function () {
                            greyscaleModalsSrv.addProduct(function () {
                                return $q.when(scope.allProducts);
                            }).then(function (productIndex) {
                                scope.products.push(productIndex);
                                scope.productsTable.tableParams.reload();
                            });
                        }
                    }
                };

                // DATA AGGREGATION
                scope.aggregates = {};

                scope.$watch('products', function (products) {
                    var promises = [];
                    products.forEach(function (product) {
                        if (!(product.product.id in scope.aggregates)) {
                            var promise = greyscaleProductApi.product(product.product.id).aggregate().then(function(res) {
                                scope.aggregates[product.product.id] = res.agg;
                            });
                            promises.push(promise);
                        }
                    });

                    $q.all(promises).then(function () {
                        var data = preprocessData(products);
                        renderVisualization(data);
                    });
                }, true);


                // VISUALIZATION
                var layout = {
                    targets: {
                        hPadding: 10,
                        vPadding: 10,
                        width: 25,
                        height: 25
                    },
                    targetLabels: {
                        fontSize: 10,
                        height: 50
                    },
                    productLabels: {
                        fontSize: 10
                    }
                };

                function preprocessData(productIndexes) {
                    var l = layout.targets;
                    l.positions = {};
                    l.targets = [];

                    var data = productIndexes.map(function (productIndex, idx) {
                        productIndex.data = scope.aggregates[productIndex.product.id].map(function (target) {
                            // horizontal position
                            if (!(target.id in l.positions)) {
                                l.positions[target.id] = Object.keys(l.positions).length * (l.width + l.hPadding) + l.hPadding;
                                l.targets.push(target);
                            }
                            target.x = l.positions[target.id];

                            // vertical position
                            target.y = idx * (l.height + l.vPadding) + l.vPadding;

                            // index value
                            target.val = target.indexes[productIndex.index.id];

                            return target;
                        });
                        return productIndex;
                    });
                    layout.targets = l;
                    return data;
                }

                function renderVisualization(data) {
                    console.log(data);
                    var d3 = $window.d3;

                    // construct color scale
                    var vals = _.flatten(data.map(function (product) {
                        return product.data.map(function (target) {
                            return target.val;
                        });
                    }));
                    var color = d3.scale.linear()
                        .domain([_.min(vals), _.max(vals)])
                        .range(['white', 'blue']);

                    // hover text
                    /*var tip = d3.tip().attr('class', 'd3-tip').html('asd');
                      svg.call(tip);*/

                    // grid of targets
                    var l = layout.targets;
                    var svg = d3.select('svg');
                    var grid = svg.append('g')
                        .attr('transform', 'translate(0, ' + layout.targetLabels.height + ')');

                    // background so white ===> min index value, bg ===> value not present
                    var gridWidth = l.targets.length * (l.width + l.hPadding) + l.hPadding;
                    var gridHeight = data.length * (l.height + l.vPadding) + l.vPadding;
                    grid.append('rect')
                        .attr('width', gridWidth)
                        .attr('height', gridHeight)
                        .attr('fill', '#eee');

                    var rows = grid.selectAll('.row').data(data).enter()
                        .append('g')
                        .attr('class', 'row');

                    var cols = rows.selectAll('.target')
                        .data(function (d) { return d.data; })
                        .enter().append('rect')
                        .attr('class', 'target')
                        .attr('x', function (d) { return d.x; })
                        .attr('y', function (d) { return d.y; })
                        .attr('width', l.width)
                        .attr('height', l.height)
                        .style('fill', function (d) { return color(d.val); });

                    // target labels
                    var targetLabels = svg.append('svg');
                    l = layout.targetLabels;
                    var offset = layout.targets.hPadding + layout.targets.width / 2 - l.fontSize / 2;
                    targetLabels.selectAll('.label')
                        .data(layout.targets.targets)
                        .enter().append('text')
                        .attr('class', 'label')
                        .attr('text-anchor', 'start')
                        .attr('y', function (d) { return layout.targets.positions[d.id] + offset; })
                        .attr('x', -l.height)
                        .attr('transform', 'rotate(-90)')
                        .style('font-size', l.fontSize + 'px')
                        .text(function (d) { return d.name; });

                    // product labels
                    l = layout.productLabels;
                    var vHeight = layout.targets.vPadding + layout.targets.height;
                    var vOffset = layout.targets.vPadding + layout.targets.height / 2 + l.fontSize / 2;
                    var productLabels = svg.append('g')
                        .attr('transform', 'translate(' + gridWidth + ', ' + layout.targetLabels.height + ')');
                    productLabels.selectAll('.label')
                        .data(data)
                        .enter().append('text')
                        .attr('class', 'label')
                        .attr('x', 0)
                        .attr('y', function (d, i) { return i * vHeight + vOffset; })
                        .style('font-size', l.fontSize + 'px')
                        .text(function (d) { return d.product.title; });
                    

                }
            }
        };
    });
