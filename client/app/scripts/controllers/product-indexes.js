angular.module('greyscaleApp')
    .controller('ProductIndexesCtrl', function (_, $q, $scope, $state, $stateParams,
        greyscaleProductApi, greyscaleUtilsSrv, greyscaleModalsSrv) {

        var tns = 'PRODUCTS.INDEXES.';

        var productId = parseInt($stateParams.productId);

        $scope.model = {
            indexes: [],
            subindexes: []
        };

        _initIndexesTable();
        _initSubindexesTable();
        _loadData();

        /* UI */
        /* Table */
        function _initIndexesTable() {
            var tableTns = tns + 'INDEXES_TABLE.';
            $scope.model.indexesTable = {
                title: tableTns + 'TABLE_TITLE',
                cols: [{
                    field: 'title',
                    title: tableTns + 'TITLE'
                }, {
                    field: 'divisor',
                    title: tableTns + 'DIVISOR'
                }, {
                    cellTemplate: '<div class="pull-right"> ' +
                        '<a class="action" ng-click="ext.editIndex(row, \'index\'); $event.stopPropagation()"><i class="fa fa-pencil"></i></a>' + 
                        '<a class="action" ng-click="ext.removeIndex(row, \'index\'); $event.stopPropagation()"><i class="fa fa-trash"></i></a>' +
                        '</div>',
                    cellTemplateExtData: {
                        editIndex: _editIndex
                    }
                }],
                dataPromise: function() {
                    var deferred = $q.defer();
                    deferred.resolve($scope.model.indexes);
                    return deferred.promise;
                },
                add: {
                    handler: function() {
                        _editIndex({}, 'index');
                    }
                }
            };
        }

        function _initSubindexesTable() {
            var tableTns = tns + 'SUBINDEXES_TABLE.';
            $scope.model.subindexesTable = {
                title: tableTns + 'TABLE_TITLE',
                cols: [{
                    field: 'title',
                    title: tableTns + 'TITLE'
                }, {
                    field: 'divisor',
                    title: tableTns + 'DIVISOR'
                }, {
                    cellTemplate: '<div class="pull-right"> ' +
                        '<a class="action" ng-click="ext.editIndex(row, \'subindex\'); $event.stopPropagation()"><i class="fa fa-pencil"></i></a>' + 
                        '<a class="action" ng-click="ext.removeIndex(row, \'subindex\'); $event.stopPropagation()"><i class="fa fa-trash"></i></a>' +
                        '</div>',
                    cellTemplateExtData: {
                        editIndex: _editIndex,
                        removeIndex: _removeIndex
                    }
                }],
                dataPromise: function() {
                    var deferred = $q.defer();
                    deferred.resolve($scope.model.subindexes);
                    return deferred.promise;
                },
                add: {
                    handler: function() {
                        _editIndex({}, 'subindex');
                    }
                }
            };
        }

        function _editIndex(index, type) {
            greyscaleModalsSrv.editIndex(index, type)
                .then(function (index) {
                    var collection = [];
                    var updated = false;
                    if (type === 'index') {
                        collection = $scope.model.indexes;
                    } else if (type === 'subindex') {
                        collection = $scope.model.subindexes;
                    }
                    for (var i = 0; i < collection.length; i++) {
                        if (collection[i].id === index.id) {
                            collection[i] = index;
                            updated = true;
                            break;
                        }
                    }
                    if (!updated) { collection.push(index); }

                    if (type === 'index') {
                        $scope.model.indexesTable.tableParams.reload();
                    } else if (type === 'subindex') {
                        $scope.model.subindexesTable.tableParams.reload();
                    }
                    // greyscaleAPI update index
                });
        }

        function _removeIndex(index, type) {
            var collection = [];
            if (type === 'index') {
                collection = $scope.model.indexes;
            } else if (type === 'subindex') {
                collection = $scope.model.subindexes;
            }
            for (var i = 0; i < collection.length; i++) {
                if (collection[i].id === index.id) {
                    collection.splice(i, 1);
                    break;
                }
            }

            if (type === 'index') {
                $scope.model.indexesTable.tableParams.reload();
            } else if (type === 'subindex') {
                $scope.model.subindexesTable.tableParams.reload();
            }
        }

        /* DATA */
        function _loadData() {
            return _loadProduct(productId)
                .then(_loadProductIndexes)
                .then(function(data) {
                    $scope.model.indexes = data.indexes;
                    $scope.model.subindexes = data.subindexes;
                });
        }

        function _loadProduct(productId) {
            return greyscaleProductApi.get(productId)
                .then(function (product) {
                    $state.ext.productName = product.title;
                    return product;
                })
                .catch(function (error) {
                    greyscaleUtilsSrv.errorMsg(error, tns + 'PRODUCT_NOT_FOUND');
                    $state.go('home');
                });
        }

        function _loadProductIndexes(product) {
            var productId = product.id;
            var reqs = {
                product: $q.when(product),
                indexes: greyscaleProductApi.product(productId).indexesList(),
                subindexes: greyscaleProductApi.product(productId).subindexesList()
            };
            return $q.all(reqs);
        }
    });
