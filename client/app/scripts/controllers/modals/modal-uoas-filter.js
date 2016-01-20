'use strict';
angular.module('greyscaleApp')
.controller('ModalUoasFilterCtrl', function ($scope, $uibModalInstance, greyscaleUoaTypesFilterTbl,
                                             greyscaleUoaClassTypesFilter, greyscaleUoaTagsFilter,
                                             greyscaleUoasFilterTbl) {

    var uoaTypes = greyscaleUoaTypesFilterTbl;
    var uoaClassTypes = greyscaleUoaClassTypesFilter;
    var uoaTags = greyscaleUoaTagsFilter;
    var uoas = greyscaleUoasFilterTbl;

    $scope.model = {
        uoaTypes: uoaTypes,
        uoaClassTypes: uoaClassTypes,
        uoaTags: uoaTags,
        uoas: uoas
    };

    $scope.filterResult = [];

    uoaTypes.multiselect.onChange = function(selected){
        uoas.dataFilter.typeId = selected;
        uoas.tableParams.reload();
    };

    uoaClassTypes.multiselect.onChange = function(selected){
        uoaTags.dataFilter.classTypeId = selected;
        uoaTags.tableParams.reload();
    };

    uoaTags.multiselect.onChange = function(selected){
        uoas.dataFilter.tagId = selected;
        uoas.tableParams.reload();
    };

    uoas.multiselect.onChange = function(selected){
        $scope.filterResult = selected;
    };

    $scope.addSelectedUoas = function(){
        $uibModalInstance.close($scope.filterResult);
    };

    $scope.close = function () {
        $uibModalInstance.dismiss();
    };

    $scope.save = function () {
        $uibModalInstance.close($scope.model);
    };

});
