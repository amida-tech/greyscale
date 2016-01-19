'use strict';
angular.module('greyscaleApp')
.controller('ModalUoasFilterCtrl', function ($scope, $uibModalInstance, greyscaleUoaTypesFilter,
                                             greyscaleUoaClassTypesFilter, greyscaleUoaTagsFilter,
                                             greyscaleUoasFilter) {

    var uoaTypes = greyscaleUoaTypesFilter;
    var uoaClassTypes = greyscaleUoaClassTypesFilter;
    var uoaTags = greyscaleUoaTagsFilter;
    var uoas = greyscaleUoasFilter;

    $scope.model = {
        uoaTypes: uoaTypes,
        uoaClassTypes: uoaClassTypes,
        uoaTags: uoaTags,
        uoas: uoas
    };

    $scope.filterResult = [];

    uoaTypes.selectable.onChange = function(selected){
        uoas.dataFilter.typeId = selected;
        uoas.tableParams.reload();
    };

    uoaClassTypes.selectable.onChange = function(selected){
        uoaTags.dataFilter.classTypeId = selected;
        uoaTags.tableParams.reload();
    };

    uoaTags.selectable.onChange = function(selected){
        uoas.dataFilter.tagId = selected;
        uoas.tableParams.reload();
    };

    uoas.selectable.onChange = function(selected){
        $scope.filterResult = selected;
    };

    $scope.addSelectedUoas = function(){

    };

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        $uibModalInstance.close($scope.model);
    };

});
