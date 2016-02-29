/**
 * Created by igi on 29.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('attachedFile', function ($log) {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="col-sm-12 col-xs-12 col-md-6 file-attach"><a class="action action-primary file-link" ng-click="download()">' +
            '<i class="fa {{iconClass}}"></i>{{file.name}}</a>' +
            '<a class="action action-danger file-remove" ng-click="remove"><i class="fa fa-trash"></i></a></div>',
            scope: {

                file: '=attachedItem',
                remove: '&removeFile'
            },
            controller: function ($scope, FileSaver, greyscaleBase64Srv) {

                $scope.iconClass = 'fa-file';
                var _saveData = {
                    data: [],
                    filename: $scope.file.name,
                    options: {type: $scope.file.type}
                };

                $scope.download = function () {
                    if ($scope.file.data) {
                        _saveData.data = new Blob([atob($scope.file.data)],{type: $scope.file.type});
                        $log.debug(_saveData);
                        FileSaver.saveAs(_saveData.data,_saveData.filename);
                    } else {

                    }
                };

                function saveAs(saveData) {

                }
            }
        };
    });
