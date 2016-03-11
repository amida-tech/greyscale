'use strict';

angular.module('greyscaleApp')
.controller('ModalEditIndexCtrl', function($scope, index, type, product, $uibModalInstance, $q, greyscaleQuestionApi, greyscaleProductApi){
    var tns = 'PRODUCTS.INDEXES.FORM.';

    /*var _userGroupsTable = greyscaleUserGroupsTbl;
    _userGroupsTable.dataFilter.organizationId = Organization.id;
    _userGroupsTable.dataFilter.selectedIds = user.usergroupId;*/

    $scope.model = {
        index: angular.copy(index),
        questions: [],
        subindexes: [],
        type: type,
        weights: []
    };

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        _setWeightsDictionary();
        $uibModalInstance.close($scope.model.index);
    };

    _getWeightsTableData()
    _initWeightsTable();
    _loadData();

    function _loadData() {
        _loadQuestions().then(_loadSubindexes);
    }

    function _loadQuestions() {
        return greyscaleQuestionApi.get(product.surveyId).get().then(function (questions) {
            $scope.model.questions = questions;
        });
    }

    function _loadSubindexes() {
        return greyscaleProductApi.product(product.id).subindexesList().then(function (subindexes) {
            $scope.model.subindexes = subindexes;
            console.log($scope.model.subindexes);
        });
    }

    function _initWeightsTable() {
        var tableTns = tns + 'WEIGHTS.';

        var cols = [];
        if (type === 'index') {
            cols.push({
                field: 'type',
                title: tableTns + 'TYPE',
                cellTemplate: '<select class="form-control" ng-model="row.type"><option value="question">Question</option><option value="subindex">Subindex</option></select>'
            });
            cols.push({
                field: 'field',
                title: tableTns + 'FIELD',
                cellTemplate: '<div ng-switch on="row.type">' +
                    '<select class="form-control" ng-model="row.field" ng-options="question.id as question.label for question in ext.questions()" ng-switch-when="question"></select>' +
                    '<select class="form-control" ng-model="row.field" ng-options="subindex.id as subindex.title for subindex in ext.subindexes()" ng-switch-when="subindex"></select>' +
                    '</div>',
                cellTemplateExtData: {
                    questions: function() { return $scope.model.questions; },
                    subindexes: function() { return $scope.model.subindexes; }
                }
            });
        } else if (type === 'subindex') {
            cols.push({
                field: 'field',
                title: tableTns + 'QUESTION',
                cellTemplate: '<select class="form-control" ng-model="row.field" ng-options="question.id as question.label for question in ext.questions()"></select>',
                cellTemplateExtData: {
                    questions: function() { return $scope.model.questions; }
                }
            });
        }
        cols.push({
            field: 'weight.weight',
            title: tableTns + 'WEIGHT',
            cellTemplate: '<input type="number" name="weight" ng-model="row.weight" class="form-control input-sm" required/>'
        });
        cols.push({
            dataFormat: 'action',
            actions: [{
                icon: 'fa-trash',
                handler: _removeWeight
            }]
        });

        $scope.model.weightsTable = {
            cols: cols,
            dataPromise: function() {
                var deferred = $q.defer();
                deferred.resolve($scope.model.weights);
                return deferred.promise;
            },
            add: {
                handler: function () {
                    $scope.model.weights.push({});
                    $scope.model.weightsTable.tableParams.reload();
                }
            }
        };
    }

    function _removeWeight(weight) {
        for (var i = 0; i < $scope.model.weights.length; i++) {
            if ($scope.model.weights[i].id === weight.id && $scope.model.weights[i].type === weight.type) {
                $scope.model.weights.splice(i, 1);
                break;
            }
        }
        $scope.model.weightsTable.tableParams.reload();
    }

    function _getWeightsTableData() {
        var weights = [];
        if (type === 'index') {
            for (var questionId in index.questionWeights) {
                weights.push({
                    type: 'question',
                    field: parseInt(questionId),
                    weight: index.questionWeights[questionId]
                });
            }
            for (var subindexId in index.subindexWeights) {
                weights.push({
                    type: 'subindex',
                    field: parseInt(subindexId),
                    weight: index.subindexWeights[subindexId]
                });
            }
        } else if (type === 'subindex') {
            for (var questionId in index.weights) {
                weights.push({
                    type: 'question',
                    field: parseInt(questionId),
                    weight: index.weights[questionId]
                });
            }
        }
        $scope.model.weights = weights;
    }

    function _setWeightsDictionary() {
        if (type === 'index') {
            $scope.model.index.questionWeights = {};
            $scope.model.index.subindexWeights = {};

            $scope.model.weights.forEach(function (weight) {
                if (weight.type === 'question') {
                    $scope.model.index.questionWeights[weight.field] = weight.weight;
                } else if (weight.type === 'subindex') {
                    $scope.model.index.subindexWeights[weight.field] = weight.weight;
                }
            });
        } else  if (type === 'subindex') {
            $scope.model.index.weights = {};

            $scope.model.weights.forEach(function (weight) {
                $scope.model.index.weights[weight.field] = weight.weight;
            });
        }
    }
});
