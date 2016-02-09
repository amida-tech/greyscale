'use strict';
angular.module('greyscaleApp')
    .directive('uploadForm', function () {
        return {
            templateUrl: 'views/directives/upload-form.html',
            restrict: 'E',
            replace: true,
            scope: {
                uploadEndpoint: '@',
                uploadError: '=',
                uploadSuccess: '=',
                uploadBefore: '='
            },
            controller: function ($scope, $timeout, greyscaleUtilsSrv, FileUploader) {
                var uploader = $scope.uploader = new FileUploader({
                    url: _getAbsoluteUrl($scope.uploadEndpoint),
                    withCredentials: false,
                    method: 'POST',
                    removeAfterUpload: 1,
                    queueLimit: 1,
                    filters: [{
                        name: 'CSV',
                        fn: function (item) {
                            var mimeType = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                            return '|csv|'.indexOf(mimeType) !== -1;
                        }
                    }]
                });

                uploader.onBeforeUploadItem = function (item) {
                    item.url = _getAbsoluteUrl($scope.uploadEndpoint);
                    if (typeof $scope.uploadBefore === 'function') {
                        $scope.uploadBefore(item);
                    }
                    $scope.model = {};
                };

                uploader.onSuccessItem = $scope.uploadSuccess;

                uploader.onErrorItem = $scope.uploadError || function (fileItem, response) {
                    $scope.model = {
                        issues: colorIssues(response.issue)
                    };
                };

                function _getAbsoluteUrl(url) {
                    return greyscaleUtilsSrv.getApiBase() + '/' + url;
                }

                function colorIssues(issues) {
                    if (issues && issues.length) {
                        for (var i = 0; i < issues.length; i++) {
                            switch (issues[i].severity) {
                            case 'error':
                                issues[i].severity = 'danger';
                                break;
                            case 'success':
                                issues[i].severity = 'success';
                                break;
                            default:
                                issues[i].severity = 'info';
                            }
                        }
                    }
                    return issues;
                }
            }
        };
    });
