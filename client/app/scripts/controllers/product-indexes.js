angular.module('greyscaleApp')
    .controller('ProductIndexesCtrl', function (_, $q, $scope, $state, $stateParams,
        greyscaleProductApi, greyscaleUtilsSrv) {

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
        function _initIndexesTable() {
            var tableTns = tns + 'INDEXES_TABLE.';
            $scope.model.indexesTable = {
                cols: [{
                    field: 'title',
                    title: tableTns + 'TITLE'
                }, {
                    field: 'divisor',
                    title: tableTns + 'DIVISOR'
                }],
                dataPromise: function() {
                    return greyscaleProductApi.product(productId).indexesList();
                }
            };
        }

        function _initSubindexesTable() {
            var tableTns = tns + 'INDEXES_TABLE.';
            $scope.model.subindexesTable = {
                cols: [{
                    field: 'title',
                    title: tableTns + 'TITLE'
                }, {
                    field: 'divisor',
                    title: tableTns + 'DIVISOR'
                }],
                dataPromise: function() {
                    return greyscaleProductApi.product(productId).subindexesList();
                }
            };
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
