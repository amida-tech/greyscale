/**
 * Created by igi on 29.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('attachedFile', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="col-sm-12 col-xs-12 col-md-6 file-attach"><a class="action action-primary file-link" ng-click="download()">' +
            '<i class="fa {{iconClass}}"></i>{{file.name}}</a>' +
            '<a class="action action-danger file-remove" ng-click="remove()"><i class="fa fa-trash"></i></a></div>',
            scope: {
                file: '=attachedItem',
                remove: '&removeFile'
            },
            controller: function ($scope, FileSaver, greyscaleBase64Srv) {
                $scope.iconClass = 'fa-file';
                var _saveData = {
                    data: [],
                    filename: $scope.file.name
                };

                $scope.download = function () {
                    if ($scope.file.data) {
                        FileSaver.saveAs(greyscaleBase64Srv.b64toBlob($scope.file.data,$scope.file.type), $scope.file.name);
                    } else {

                    }
                };
            }
        };
    });
