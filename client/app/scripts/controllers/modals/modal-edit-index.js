'use strict';

angular.module('greyscaleApp')
.controller('ModalEditIndexCtrl', function($scope, index, type, $uibModalInstance, $q){
    var tns = 'PRODUCTS.INDEXES.FORM.';

    /*var _userGroupsTable = greyscaleUserGroupsTbl;
    _userGroupsTable.dataFilter.organizationId = Organization.id;
    _userGroupsTable.dataFilter.selectedIds = user.usergroupId;*/

    $scope.model = {
        index: angular.copy(index),
        type: type
    };

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        _setWeightsDictionary();
        $uibModalInstance.close($scope.model.index);
    };

    _initWeightsTable();

    function _initWeightsTable() {
        var tableTns = tns + 'WEIGHTS.';
        $scope.model.weights = {
            cols: [{
                field: 'type',
                title: tableTns + 'TYPE'
            },
            {
                field: 'field',
                title: tableTns + 'FIELD'
            },
            {
                field: 'weight',
                title: tableTns + 'WEIGHT'
            }],
            dataPromise: function() {
                var deferred = $q.defer();
                deferred.resolve(_getWeightsTableData());
                return deferred.promise;
            }
        };
    }

    function _getWeightsTableData() {
        var weights = [];
        if (type === 'index') {
            for (var questionId in index.questionWeights) {
                weights.push({
                    type: 'question',
                    field: questionId,
                    weight: index.questionWeights[questionId]
                });
            }
            for (var subindexId in index.subindexWeights) {
                weights.push({
                    type: 'subindex',
                    field: subindexId,
                    weight: index.subindexWeights[subindexId]
                });
            }
        } else if (type === 'subindex') {
            for (var questionId in index.weights) {
                weights.push({
                    type: 'question',
                    field: questionId,
                    weight: index.weights[questionId]
                });
            }
        }
        return weights;
    }

    function _setWeightsDictionary() {
        if (type === 'index') {
            $scope.model.index.questionWeights = {};
            $scope.model.index.subindexWeights = {};

            $scope.model.weights.tableParams.data.forEach(function (weight) {
                if (weight.type === 'question') {
                    $scope.model.index.questionWeights[weight.field] = weight.weight;
                } else if (weight.type === 'subindex') {
                    $scope.model.index.subindexWeights[weight.field] = weight.weight;
                }
            });
        } else  if (type === 'subindex') {
            $scope.model.index.weights = {};

            $scope.model.weights.tableParams.data.forEach(function (weight) {
                $scope.model.index.weights[weight.field] = weight.weight;
            });
        }
    }
});
