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
                    cellTemplate: '<a class="action" ng-click="ext.editIndex(row, \'index\'); $event.stopPropagation()"><i class="fa fa-pencil"></i></a>',
                    cellTemplateExtData: {
                        editIndex: _editIndex
                    }
                }],
                dataPromise: function() {
                    return greyscaleProductApi.product(productId).indexesList();
                }
            };
        }

        function _initSubindexesTable() {
            var tableTns = tns + 'INDEXES_TABLE.';
            $scope.model.subindexesTable = {
                title: tableTns + 'TABLE_TITLE',
                cols: [{
                    field: 'title',
                    title: tableTns + 'TITLE'
                }, {
                    field: 'divisor',
                    title: tableTns + 'DIVISOR'
                }, {
                    cellTemplate: '<a class="action" ng-click="ext.editIndex(row, \'subindex\'); $event.stopPropagation()"><i class="fa fa-pencil"></i></a>',
                    cellTemplateExtData: {
                        editIndex: _editIndex
                    }
                }],
                dataPromise: function() {
                    return greyscaleProductApi.product(productId).subindexesList();
                }
            };
        }

        /* Weights */
        function _editIndex(index, type) {
            console.log(type);
            greyscaleModalsSrv.editIndex(index, type);
            /*greyscaleModalsSrv.userGroups(user)
                .then(function (selectedGroupIds) {
                    user.usergroupId = selectedGroupIds;
                    greyscaleUserApi.update(user);
                });
                */
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
