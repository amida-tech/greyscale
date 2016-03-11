angular.module('greyscaleApp')
    .controller('ProductIndexesCtrl', function (_, $q, $scope, $state, $stateParams,
        greyscaleProductApi, greyscaleUtilsSrv, greyscaleModalsSrv) {

        var tns = 'PRODUCTS.INDEXES.';

        var productId = parseInt($stateParams.productId);

        $scope.model = {
            indexes: [],
            subindexes: []
        };

        _initIndexesTables();
        _loadData().then(function() {
            $scope.model.indexesTable.tableParams.reload();
            $scope.model.subindexesTable.tableParams.reload();
        });

        /* UI */
        /* Table */
        function _initIndexesTables() {
            $scope.model.indexesTable = _genTableConfig('index', tns + 'INDEXES_TABLE.');
            $scope.model.subindexesTable = _genTableConfig('subindex', tns + 'SUBINDEXES_TABLE.');
        }

        function _genTableConfig(type, tableTns) {
            return {
                title: tableTns + 'TABLE_TITLE',
                cols: [{
                    field: 'title',
                    title: tableTns + 'TITLE',
                    cellClass: 'text-center'
                }, {
                    dataFormat: 'action',
                    actions: [{
                        icon: 'fa-pencil',
                        handler: function (row) { _editIndex(row, type); }
                    }, {
                        icon: 'fa-trash',
                        handler: function (row) { _removeIndex(row, type); }
                    }]
                }],
                dataPromise: function() {
                    var deferred = $q.defer();
                    if (type === 'index') {
                        deferred.resolve($scope.model.indexes);
                    } else if (type === 'subindex') {
                        deferred.resolve($scope.model.subindexes);
                    }
                    return deferred.promise;
                },
                add: {
                    handler: function() { _editIndex({}, type); }
                }
            };
        }

        function _editIndex(index, type) {
            greyscaleModalsSrv.editIndex(index, type, $scope.model.product)
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
                        greyscaleProductApi.product(productId).indexesListUpdate($scope.model.indexes);
                    } else if (type === 'subindex') {
                        $scope.model.subindexesTable.tableParams.reload();
                        greyscaleProductApi.product(productId).subindexesListUpdate($scope.model.subindexes);
                    }
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
                    $scope.model.product = data.product;
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
