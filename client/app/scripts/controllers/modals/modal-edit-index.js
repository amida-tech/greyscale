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
        // $uibModalInstance.close(_userGroupsTable.multiselect.selectedMap);
    };

    _initWeightsTable();
    console.log(_getWeightsTableData());

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
});
