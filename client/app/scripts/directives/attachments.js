/**
 * Created by igi on 29.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('attachments', function () {
        return {
            restrict: 'AE',
            scope: {
                model: '=model',
                options: '='
            },
            template: '<div class="panel attachments"><p translate="SURVEYS.ATTACHMENTS" class="panel-title"></p>' +
                '<div class="panel-body"><div class="row">' +
                '<attached-file attached-item="item" ng-repeat="item in model track by $index" remove-file="remove($index)"></attached-file>' +
                '</div><form ng-show="!uploader.progress" class="row" name="{{formName}}"><input type="file" class="form-control input-file" name="file" nv-file-select uploader="uploader" ng-hide="options.readonly">' +
                '</form>' +
                '<div class="progress" ng-if="uploader.progress">' +
                '  <div class="progress-bar" role="progressbar" ng-style="{ \'width\': uploader.progress + \'%\' }"></div>' +
                '</div>' +
                '</div></div>',

            controller: function ($scope, $element, greyscaleUtilsSrv, FileUploader, $timeout, greyscaleTokenSrv,
                greyscaleAttachmentApi, greyscaleGlobals, greyscaleUploadApi) {

                $scope.formName = 'f_' + new Date().getTime();

                $scope.remove = removeAttach;

                $scope.model = $scope.model || [];

                $scope.inProgress = [];

                var uploader = $scope.uploader = new FileUploader({
                    withCredentials: false,
                    disableMultipart: true,
                    method: 'PUT',
                    removeAfterUpload: true,
                    autoUpload: false
                });

                uploader.onAfterAddingFile = function (item) {

                    if ($scope.formName && $scope[$scope.formName].$$parentForm) {
                        $scope[$scope.formName].$$parentForm.$dirty = false;
                    }

                    var uploadData = {
                        size: item.file.size,
                        type: item.file.type,
                        name: item.file.name
                    };

                    greyscaleUploadApi.getUrl(uploadData).then(function (response) {
                        item.url = response.url;
                        item.key = response.key;
                        item.headers = {
                            'Content-Disposition': 'attachment; filename="' + item.file.name + '"'
                        };
                        item.upload();
                    });
                };

                uploader.onCompleteItem = function (item) {
                    if (!item.isError) {
                        var attachData = {
                            key: item.key
                        };
                        greyscaleUploadApi.success(attachData).then(function (data) {
                            $scope.model.push({
                                id: data.id,
                                filename: item.file.name,
                                mimeType: item.file.mimetype
                            });
                            _modifyEvt();
                        });
                    }

                    uploader.clearQueue();
                    $element.find('form')[0].reset();
                    $scope.inProgress.splice(item.idx, 1);
                    $timeout(function () {
                        $scope.$digest();
                    });
                };

                uploader.onErrorItem = function (file, response, status, headers) {
                    greyscaleUtilsSrv.errorMsg(response || 'Server error', 'Upload file');
                };

                function removeAttach(idx) {
                    var deleted = $scope.model.splice(idx, 1);
                    greyscaleAttachmentApi.delete(deleted[0].id)
                        .then(_modifyEvt)
                        .catch(function (err) {
                            greyscaleUtilsSrv.errorMsg(err, 'Delete attachment');
                        });
                }

                function _modifyEvt() {
                    $scope.$emit(greyscaleGlobals.events.survey.answerDirty);
                }

            }
        };
    });
