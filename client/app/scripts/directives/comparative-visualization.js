'use strict';

angular.module('greyscaleApp')
    .directive('comparativeViz', function ($window, $http, $stateParams, $q, Organization, greyscaleOrganizationApi, greyscaleModalsSrv, greyscaleProductApi, greyscaleComparativeVisualizationApi) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/comparative-visualization.html',
            link: function (scope, element, attrs) {
                scope.savedVisualization = false;
                scope.visualizationTitle = null;

                // PRODUCT SELECTION
                scope.products = [];

                //Load all products
                function _loadProducts() {
                    return greyscaleOrganizationApi.products(Organization.id).then(function (products) {
                        scope.allProducts = products;
                    });
                }
                Organization.$watch(scope, function () {
                    _loadProducts().then(function () {
                        if ($stateParams.visualizationId) {
                            scope.savedVisualization = true;
                            _loadVisualization($stateParams.visualizationId);
                        }
                    });
                });

                scope.clearProducts = function () {
                    scope.products = [];
                    scope.productsTable.tableParams.reload();
                };

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
                        handler: scope.addProduct
                    }
                };
                scope.addProduct = function () {
                    greyscaleModalsSrv.addProduct(function () {
                        return $q.when(scope.allProducts).then(function (products) {
                            // hide already-added products
                            var added = new Set();
                            scope.products.forEach(function (datum) {
                                added.add(datum.product.id);
                            });

                            return products.filter(function (product) {
                                return !added.has(product.id);
                            });
                        });
                    }).then(function (productIndex) {
                        scope.products.push(productIndex);
                        scope.productsTable.tableParams.reload();
                    });
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
                        _renderVisualization(_preprocessData(products));
                        if (products.length === 0) {
                            _clearVisualization();
                        }
                    });
                }, true);


                // LOADING/SAVING
                function _getConfiguration() {
                    var products = scope.products.map(function (datum) {
                        return {
                            productId: datum.product.id,
                            indexId: datum.index.id
                        };
                    });
                    return {
                        products: products,
                        title: scope.visualizationTitle
                    };
                }

                scope.saveVisualization = function () {
                    return greyscaleComparativeVisualizationApi(Organization.id).update(scope.visualizationId, _getConfiguration());
                };

                function _loadConfiguration(vizData) {
                    scope.visualizationTitle = vizData.title;
                    scope.model.title = vizData.title;
                    return $q.all(vizData.products.map(function (datum) {
                        // product
                        datum.product = _.findWhere(scope.allProducts, { id: datum.productId });
                        // index
                        return greyscaleProductApi.product(datum.productId).indexesList().then(function (indexes) {
                            datum.index = _.findWhere(indexes, { id: datum.indexId });
                            return datum;
                        });
                    })).then(function (data) {
                        scope.products = data;
                        scope.productsTable.tableParams.reload();
                    });
                }

                function _loadVisualization(vizId) {
                    scope.visualizationId = vizId;
                    return greyscaleComparativeVisualizationApi(Organization.id).get(vizId).then(_loadConfiguration);
                }

                // VISUALIZATION
                var layout = {
                    targets: {
                        hPadding: 12.5,
                        vPadding: 12.5,
                        width: 35,
                        height: 35
                    },
                    targetLabels: {
                        fontSize: 12,
                        height: 75,
                        vPadding: 5
                    },
                    productLabels: {
                        fontSize: 12,
                        hPadding: 5,
                        width: 125
                    },
                    axis: {
                        colorWidth: 20,
                        innerPadding: 5,
                        minHeight: 150
                    },
                    colors: ['#DB3340', '#20DA9B'] // 2 only
                };

                function _preprocessData(productIndexes) {
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

                function _clearVisualization(data) {
                    var d3 = $window.d3;
                    var svg = d3.select('svg');
                    svg.select('#grid #background').attr('fill', '#fff');
                    svg.select('#scale #axis').selectAll('*').remove();
                    svg.select('#scale rect').attr('fill', '#fff');
                }

                function _renderVisualization(data) {
                    var d3 = $window.d3;

                    // construct color scale
                    var vals = _.flatten(data.map(function (product) {
                        return product.data.map(function (target) {
                            return target.val;
                        });
                    }));
                    var color = d3.scale.linear()
                        .domain([_.min(vals), _.max(vals)])
                        .range(layout.colors);

                    var svg = d3.select('svg');

                    // hover text
                    // TODO: fix tooltips (not working with dynamic data viz)
                    /*var tip = d3.tip()
                        .attr('class', 'd3-tip')
                        .html(function (d) { return d.val; });
                    svg.call(tip);*/

                    // grid of targets
                    var l = layout.targets;
                    var grid = svg.select('#grid')
                        .attr('transform', 'translate(0, ' + (layout.targetLabels.height + layout.targetLabels.vPadding) + ')');

                    // background so white ===> min index value, bg ===> value not present
                    var gridWidth = l.targets.length * (l.width + l.hPadding) + l.hPadding;
                    var gridHeight = data.length * (l.height + l.vPadding) + l.vPadding;
                    grid.select('#background')
                        .attr('width', gridWidth)
                        .attr('height', gridHeight)
                        .attr('fill', '#eee');

                    var rows = grid.selectAll('.row').data(data);
                    rows.enter().append('g')
                        .attr('class', 'row');
                    rows.exit().remove();

                    var cols = rows.selectAll('.target').data(function (d) { return d.data; });
                    cols.enter().append('rect')
                        .attr('class', 'target')
                        .attr('width', l.width)
                        .attr('height', l.height)
                        /*.on('mouseover', tip.show)
                        .on('mouseout', tip.hide)*/;
                    cols.exit().remove();
                    cols
                        .attr('x', function (d) { return d.x; })
                        .attr('y', function (d) { return d.y; })
                        .style('fill', function (d) { return color(d.val); });

                    // target labels
                    var targetLabels = svg.select('#targetLabels');
                    l = layout.targetLabels;
                    var offset = layout.targets.hPadding + layout.targets.width / 2 - l.fontSize / 2;
                    var labels = targetLabels.selectAll('.label').data(layout.targets.targets);
                    labels.enter().append('text')
                        .attr('class', 'label')
                        .attr('text-anchor', 'start')
                        .attr('x', -l.height)
                        .attr('transform', 'rotate(-90)')
                        .style('font-size', l.fontSize + 'px');
                    labels.exit().remove();
                    labels
                        .attr('y', function (d) { return layout.targets.positions[d.id] + offset; })
                        .text(function (d) { return d.name; });

                    // product labels
                    l = layout.productLabels;
                    var hOffset = gridWidth + l.hPadding;
                    var vizWidth = hOffset + l.width + l.hPadding;
                    var vHeight = layout.targets.vPadding + layout.targets.height;
                    offset = layout.targets.vPadding + layout.targets.height / 2 + l.fontSize / 2;
                    var vOffset = layout.targetLabels.height + layout.targetLabels.vPadding;
                    var vizHeight = vOffset + data.length * vHeight + layout.targets.vPadding;
                    var productLabels = svg.select('#productLabels')
                        .attr('transform', 'translate(' + hOffset + ', ' + vOffset + ')');
                    labels = productLabels.selectAll('.label').data(data);
                    labels.enter().append('text')
                        .attr('class', 'label')
                        .attr('x', 0)
                        .style('font-size', l.fontSize + 'px');
                    labels.exit().remove();
                    labels
                        .attr('y', function (d, i) { return i * vHeight + offset; })
                        .text(function (d) { return d.product.title; });
                    

                    // color scale axis
                    l = layout.axis;
                    var axisHeight = vizHeight - vOffset;
                    if (axisHeight < l.minHeight) { axisHeight = l.minHeight; }
                    var scale = svg.select('#scale')
                        .attr('transform', 'translate(' + vizWidth + ', ' + vOffset + ')');
                    vizWidth += l.colorWidth + l.innerPadding;
                    var pos = d3.scale.linear() // position encoder
                        .domain(color.domain())
                        .range([0, axisHeight]);
                    var axis = d3.svg.axis()
                        .scale(pos)
                        .orient('right')
                        .ticks(5);

                    // colored scale
                    var gradient = svg.select('defs')
                        .append('linearGradient')
                        .attr('id', 'scaleGradient')
                        .attr('x1', '0%')
                        .attr('y1', '0%')
                        .attr('x2', '0%')
                        .attr('y2', '100%');
                    gradient.append('stop')
                        .attr('offset', '0%')
                        .attr('stop-color', layout.colors[0])
                        .attr('stop-opacity', 1);
                    gradient.append('stop')
                        .attr('offset', '100%')
                        .attr('stop-color', layout.colors[1])
                        .attr('stop-opacity', 1);
                    scale.select('rect')
                        .attr('height', axisHeight)
                        .attr('width', l.colorWidth)
                        .attr('fill', 'url(#scaleGradient)');

                    // numerical axis
                    var axisG = scale.select('#axis')
                        .attr('transform', 'translate(' + (l.colorWidth + l.innerPadding) + ', 0)')
                        .attr('class', 'axis')
                        .call(axis);
                    var bbox = axisG.node().getBBox();
                    vizWidth += bbox.width;
                    vizHeight = vOffset + bbox.height;

                    // resize svg and container (for styling)
                    $('.comparative-container').width(0);
                    $('.comparative-container').width($('comparative-viz > div.row').outerWidth(true) - 1);
                    $('svg').attr('width', vizWidth).attr('height', vizHeight);
                }
            }
        };
    });
