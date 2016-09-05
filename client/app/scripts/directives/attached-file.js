/**
 * Created by igi on 29.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('attachedFile', function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'views/directives/attached-file.html',
            scope: {
                file: '=attachedItem',
                remove: '&removeFile',
                readonly: '='
            },
            controller: function ($scope, greyscaleUploadApi, $timeout) {
                $scope.iconClass = 'fa-file';

                $scope.download = function (evt) {
                    if (!$scope.url) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        greyscaleUploadApi.getDownloadUrl($scope.file.id)
                            .then(function (data) {
                                if (data.ticket) {
                                    $scope.url = greyscaleUploadApi.getLink(data.ticket);
                                } else if (data.url) {
                                    $scope.url = data.url;
                                }
                                if ($scope.url) {
                                    $timeout(function () {
                                        evt.currentTarget.click();
                                    });
                                }
                            });
                    }
                };
            }
        };
    });
