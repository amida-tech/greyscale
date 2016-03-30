'use strict';

angular.module('greyscaleApp')
    .directive('comparativeViz', function ($window, $http, $stateParams, $q, Organization, greyscaleOrganizationApi, greyscaleModalsSrv, greyscaleProductApi, greyscaleComparativeVisualizationApi) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/comparative-visualization.html',
            link: function (scope, element, attrs) {
                scope.savedVisualization = false;
                scope.visualizationTitle = null;
                scope.targets = [];
                scope.selectedTargets = [];
                scope.setInitialTargets = false;
                scope.allData = [];

                // PRODUCT SELECTION
                scope.datasources = {
                    products: [],
                    datasets: []
                };

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
                    scope.datasources.products = [];
                    scope.datasources.datasets.forEach(function (dataset) {
                        greyscaleComparativeVisualizationApi(Organization.id)
                            .datasets(scope.visualizationId)
                            .del(dataset.id);
                    });
                    scope.datasources.datasets = [];
                    scope.productsTable.tableParams.reload();
                    scope.saveVisualization();
                };

                //Table for product selection and index normalization
                scope.productsTable = {
                    title: 'Selected Products',
                    cols: [{
                        field: 'product',
                        title: 'Datasource',
                        cellClass: 'text-center',
                        cellTemplate: '<span ng-if="row.product">{{row.product.title}} ({{row.index.title}})</span>' +
                            '<span ng-if="!row.product">{{row.title}}</span>'
                    }, {
                        dataFormat: 'action',
                        actions: [{
                            icon: 'fa-edit',
                            handler: function (row) {
                                if (row.product) {
                                    scope.editProduct(row);
                                } else {
                                    scope.importDataset(row);
                                }
                            }
                        }, {
                            icon: 'fa-trash',
                            handler: function (row) {
                                // TODO delete datasets as well
                                var i;
                                if (row.product) {
                                    for (i = 0; i < scope.datasources.products.length; i++) {
                                        if (scope.datasources.products[i].product.id === row.product.id && scope.datasources.products[i].index.id === row.index.id) {
                                            scope.datasources.products.splice(i, 1);
                                            break;
                                        }
                                    }
                                    scope.saveVisualization();
                                } else {
                                    for (i = 0; i < scope.datasources.datasets.length; i++) {
                                        if (scope.datasources.datasets[i].id === row.id) {
                                            scope.datasources.datasets.splice(i, 1);
                                            break;
                                        }
                                    }
                                    greyscaleComparativeVisualizationApi(Organization.id)
                                        .datasets(scope.visualizationId)
                                        .del(row.id);
                                }
                                scope.productsTable.tableParams.reload();
                            }
                        }]
                    }],
                    dataPromise: function () {
                        return $q.when(scope.datasources.products.concat(scope.datasources.datasets));
                    }
                };
                scope.editProduct = function (productIndex) {
                    greyscaleModalsSrv.addProduct(productIndex, function () {
                        return $q.when(scope.allProducts).then(function (products) {
                            // hide already-added products
                            var added = new Set();
                            scope.datasources.products.forEach(function (datum) {
                                added.add(datum.product.id);
                            });

                            return products.filter(function (product) {
                                // include currently selected product when editing
                                return !added.has(product.id) ||
                                    (productIndex && productIndex.product && product.id === productIndex.product.id);
                            });
                        });
                    }).then(function (newProductIndex) {
                        var added = false;
                        if (productIndex && productIndex.product) {
                            for (var i = 0; i < scope.datasources.products.length; i++) {
                                if (scope.datasources.products[i].product.id === productIndex.product.id && scope.datasources.products[i].index.id === productIndex.index.id) {
                                    scope.datasources.products[i].product = newProductIndex.product;
                                    scope.datasources.products[i].index = newProductIndex.index;
                                    added = true;
                                    break;
                                }
                            }
                        }
                        if (!added) {
                            scope.datasources.products.push(newProductIndex);
                        }

                        scope.productsTable.tableParams.reload();
                        scope.saveVisualization();
                    });
                };

                // IMPORTING DATASETS
                scope.importDataset = function (dataset) {
                    greyscaleModalsSrv.importDataset(dataset, scope.visualizationId).then(function (dataset) {
                        // update existing dataset
                        if (dataset.id) {
                            greyscaleComparativeVisualizationApi(Organization.id)
                                .datasets(scope.visualizationId)
                                .update(dataset.id, dataset)
                                .then(function() {

                                for (var i = 0; i < scope.datasources.datasets.length; i++) {
                                    if (scope.datasources.datasets[i].id === dataset.id) {
                                        // editable fields
                                        ['title', 'uoaCol', 'uoaType', 'yearCol', 'dataCol'].forEach(function (field) {
                                            scope.datasources.datasets[i][field] = dataset[field];
                                        });

                                        // clear cached data
                                        if (dataset.id in scope.datasetsData) {
                                            delete scope.datasetsData[dataset.id];
                                        }
                                    }
                                }

                                scope.productsTable.tableParams.reload();
                            });
                        // new dataset
                        } else {
                            dataset.cols = dataset.cols.map(function (col) {
                                return col.title;
                            });

                            greyscaleComparativeVisualizationApi(Organization.id)
                                .datasets(scope.visualizationId)
                                .add(dataset).then(function(resp) {
                                    dataset.id = resp.id;

                                    scope.datasources.datasets.push(dataset);
                                    scope.productsTable.tableParams.reload();
                            });
                        }
                    });
                };

                // DATA AGGREGATION
                scope.aggregates = {};
                scope.datasetsData = {};

                scope.$watch('datasources', function (newValue, oldValue) {
                    var cols = ['indexId', 'productId', 'title', 'dataCol', 'id', 'title', 'uoaCol', 'uoaType', 'yearCol'];
                    newValue = [newValue.products, newValue.datasets].map(function (datum) {
                        return datum.map(function (product) {
                            return _.pick(product, cols);
                        });
                    });
                    oldValue = [oldValue.products, oldValue.datasets].map(function (datum) {
                        return datum.map(function (product) {
                            return _.pick(product, cols);
                        });
                    });
                    if (!_.isEqual(newValue, oldValue)) {
                        console.log(newValue, oldValue);
                        var promises = [];
                        // aggregate data for each product
                        scope.datasources.products.forEach(function (product) {
                            if (!(product.product.id in scope.aggregates)) {
                                var promise = greyscaleProductApi.product(product.product.id).aggregate().then(function(res) {
                                    scope.aggregates[product.product.id] = res.agg;
                                });
                                promises.push(promise);
                            }
                        });
                        // load data from each dataset
                        scope.datasources.datasets.forEach(function (dataset) {
                            if (!(dataset.id in scope.datasetsData)) {
                                var promise = greyscaleComparativeVisualizationApi(Organization.id)
                                    .datasets(scope.visualizationId)
                                    .get(dataset.id)
                                    .then(function (data) {
                                        scope.datasetsData[dataset.id] = data;
                                });
                                promises.push(promise);
                            }

                        });

                        $q.all(promises).then(_render);
                    }
                }, true);

                function _render() {
                    console.log('_render called');
                    var data = _selectProductData(scope.datasources.products).concat(_selectDatasetData(scope.datasources.datasets));
                    // currently selected
                    var selected = new Set(_.pluck(scope.selectedTargets, 'id'));
                    // all targets
                    scope.targets = _.sortBy(_.uniq(_.flatten(data.map(function (dataset) {
                        return dataset.data.map(function (target) {
                            return {
                                id: target.id,
                                name: target.name
                            };
                        });
                    })), function (target) {
                        // uniq by id
                        return target.id;
                    }), function (target) {
                        // sort by name
                        return target.name;
                    });
                    scope.selectedTargets = scope.targets.map(function (target) {
                        target.selected = selected.has(target.id);
                        return target;
                    });
                    if (scope.initialSelectedTargets !== null) {
                        selected = new Set(scope.initialSelectedTargets);
                        // isteven-multi-select requires us to set selection by modifying
                        // input model and setting 'selected'
                        scope.selectedTargets = scope.targets.map(function (target) {
                            target.selected = selected.has(target.id);
                            return target;
                        });
                        scope.initialSelectedTargets = null;
                    }

                    scope.allData = data;
                    _filterAndRender();
                }

                function _filterAndRender() {
                    var selected = new Set();
                    scope.selectedTargets.forEach(function (target) {
                        selected.add(target.id);
                    });
                    var data = scope.allData.map(function (dataset) {
                        dataset = _.clone(dataset);
                        dataset.data = dataset.data.filter(function (target) {
                            return selected.has(target.id);
                        });
                        return dataset;
                    });

                    data = _preprocessData(data);
                    _renderVisualization(data);
                    if (data.length === 0 || layout.targets.targets.length === 0) {
                        _clearVisualization();
                    }
                }

                scope.$watch('selectedTargets', function() {
                    /*console.log(_.pluck(scope.selectedTargets, 'id'));
                    console.log(scope.initialSelectedTargets);
                    if (!_.isEqual(_.pluck(scope.selectedTargets, 'id'), scope.initialSelectedTargets)) {
                        console.log("CLEARING INITIAL");
                        scope.initialSelectedTargets = null;
                    }*/
                    _filterAndRender();
                    scope.saveVisualization();
                }, true);

                function _selectProductData(productIndexes) {
                    return productIndexes.map(function (productIndex) {
                        productIndex = _.clone(productIndex);
                        productIndex.title = productIndex.product.title;
                        productIndex.data = scope.aggregates[productIndex.product.id].map(function (target) {
                            // index value
                            target.val = target.indexes[productIndex.index.id];
                            return target;
                        }).filter(function (target) {
                            return (typeof target.val !== 'undefined') && (target.val !== null);
                        });
                        return productIndex;
                    });
                }

                function _selectDatasetData(datasets) {
                    var results = [];
                    datasets.forEach(function (dataset) {
                        if (dataset.id in scope.datasetsData) {
                            results = results.concat(scope.datasetsData[dataset.id]);
                        }
                    });
                    return results;
                }

                // LOADING/SAVING
                function _getConfiguration() {
                    var products = scope.datasources.products.map(function (datum) {
                        return {
                            productId: datum.product.id,
                            indexId: datum.index.id
                        };
                    });
                    return {
                        products: products,
                        title: scope.visualizationTitle,
                        targetIds: scope.selectedTargets.map(function (target) {
                            return target.id
                        })
                    };
                }

                scope.saveVisualization = function () {
                    return greyscaleComparativeVisualizationApi(Organization.id).update(scope.visualizationId, _getConfiguration());
                };

                function _loadConfiguration(vizData) {
                    scope.visualizationTitle = vizData.title;
                    scope.model.title = vizData.title;
                    scope.initialSelectedTargets = vizData.targetIds;

                    var productPromise = $q.all(vizData.products.map(function (datum) {
                        // product
                        datum.product = _.findWhere(scope.allProducts, { id: datum.productId });
                        // index
                        return greyscaleProductApi.product(datum.productId).indexesList().then(function (indexes) {
                            datum.index = _.findWhere(indexes, { id: datum.indexId });
                            return datum;
                        });
                    }));
                    var datasetPromise = greyscaleComparativeVisualizationApi(Organization.id).datasets(scope.visualizationId).list();
                    $q.all([productPromise, datasetPromise]).then(function (result) {
                        console.log("setting scope.datasources");
                        scope.datasources = {
                            products: result[0],
                            datasets: result[1]
                        };
                        scope.productsTable.tableParams.reload();
                    });
                    /*return $q.all(vizData.products.map(function (datum) {
                    })).then(function (data) {
                        scope.products = data;
                        scope.productsTable.tableParams.reload();
                        scope.datasets = [];
                    }).then(function() {
                        // imported datasets
                        return greyscaleComparativeVisualizationApi(Organization.id).datasets(scope.visualizationId).list();
                    }).then(function(data) {
                        scope.datasets = data;
                        scope.productsTable.tableParams.reload();
                    });*/
                }

                function _loadVisualization(vizId) {
                    scope.visualizationId = vizId;
                    return greyscaleComparativeVisualizationApi(Organization.id).get(vizId).then(_loadConfiguration);
                }

                // VISUALIZATION
                var layout = {
                    vPadding: 10,
                    hPadding: 0,
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
                        minHeight: 150,
                        fontSize: 12
                    },
                    colors: ['#DB3340', '#20DA9B'] // 2 only
                };

                function _preprocessData(productIndexes) {
                    var l = layout.targets;
                    l.positions = {};
                    l.targets = [];

                    var data = productIndexes.map(function (productIndex, idx) {
                        productIndex.data = productIndex.data.map(function (target) {
                            // horizontal position
                            if (!(target.id in l.positions)) {
                                l.positions[target.id] = Object.keys(l.positions).length * (l.width + l.hPadding) + l.hPadding;
                                l.targets.push(target);
                            }
                            target.x = l.positions[target.id];

                            // vertical position
                            target.y = idx * (l.height + l.vPadding) + l.vPadding;

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
                    svg.select('#productLabels').selectAll('*').remove();
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
                    var tip = d3.tip()
                        .attr('class', 'd3-tip')
                        .direction('e')
                        .offset([0,8])
                        .html(function (d) { return d.val; });
                    svg.call(tip);

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
                        .on('mouseover', tip.show)
                        .on('mouseout', tip.hide);
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
                        .text(function (d) { return d.title; });
                    

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
                        .attr('font-size', l.fontSize + 'px')
                        .call(axis);
                    var bbox = axisG.node().getBBox();
                    vizWidth += bbox.width + layout.hPadding;
                    vizHeight = vOffset + bbox.height + layout.vPadding;

                    // resize svg and container (for styling)
                    if (data.length > 0) {
                        $('.comparative-container').width(0);
                        $('.comparative-container').width($('comparative-viz > div.row').outerWidth(true) - 1);
                        $('svg').attr('width', vizWidth).attr('height', vizHeight);
                    }
                }
            }
        };
    });
