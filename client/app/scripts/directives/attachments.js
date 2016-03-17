/**
 * Created by igi on 29.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('attachments', function ($log) {
        return {
            restrict: 'AE',
            scope: {
                answerId: '@',
                model: '=model',
                options: '='
            },
            template: '<div class="panel attachments"><p translate="SURVEYS.ATTACHMENTS" class="panel-title"></p>' +
                '<div class="panel-body"><div class="row">' +
                '<attached-file attached-item="item" ng-repeat="item in model" remove-file="remove($index)"></attached-file>' +
                '</div><div class="row"><input type="file" class="form-control input-file" name="file" nv-file-select uploader="uploader" ng-hide="options.readonly">' +
                '</div></div></div>',

            controller: function ($scope, $element, greyscaleUtilsSrv, FileUploader, $timeout, greyscaleTokenSrv) {
                var _url = greyscaleUtilsSrv.getApiBase() + '/' + ['survey_answers', $scope.ansewerId].join('/'),
                    _token = greyscaleTokenSrv();

                $scope.remove = removeAttach;

                $scope.inProgress = [];

                var uploader = $scope.uploader = new FileUploader({
                    url: _url,
                    withCredentials: false,
                    method: 'POST',
                    removeAfterUpload: true,
                    autoUpload: true
                });

                uploader.onBeforeUploadItem = function (item) {
                    $log.debug('uploading', item);
                    item.url = _url;
                    item.headers.token = _token;
                    $scope.inProgress.push(item);
                };

                uploader.onCompleteItem = function (item, data) {
                    $log.debug('completed', item, data);
                    uploader.clearQueue();
                    $timeout(function () {
                        $scope.$digest();
                    });
                };

                uploader.onErrorItem = function (file, response) {
                    greyscaleUtilsSrv.errorMsg(response, 'Upload file');
                };

                function removeAttach(idx) {
                    /* 2do add API call to remove on server */
                    var deleted = $scope.model.splice(idx, 1);
                    $log.debug('2do add API call to remove file on server', deleted);
                }
            }
        };
    });
