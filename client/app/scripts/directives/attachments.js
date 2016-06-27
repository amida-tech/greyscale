/**
 * Created by igi on 29.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('attachments', function () {
        return {
            restrict: 'AE',
            scope: {
                field: '=',
                options: '='
            },
            template: '<div class="panel attachments" ng-show="isVisible"><p translate="SURVEYS.ATTACHMENTS" class="panel-title"></p>' +
                '<div class="panel-body"><div class="row"><attached-file attached-item="item" ' +
                'ng-repeat="item in field.attachments track by $index" remove-file="remove($index)"></attached-file>' +
                '</div><form ng-show="!uploader.progress" class="row" name="{{formName}}">' +
                '<input type="file" class="form-control input-file" name="file" nv-file-select uploader="uploader" ' +
                'ng-hide="options.readonly"></form><div class="progress" ng-if="uploader.progress">' +
                '<div class="progress-bar" role="progressbar" ng-style="{ \'width\': uploader.progress + \'%\' }">' +
                '</div></div></div></div>',

            controller: function ($scope, $element, greyscaleUtilsSrv, FileUploader, $timeout, greyscaleGlobals,
                greyscaleUploadApi) {

                $scope.field = $scope.field || {};
                $scope.field.attachments = $scope.field.attachments || [];
                $scope.isVisible = ($scope.field.attachments.length > 0 || !$scope.options.readonly);
                $scope.formName = 'f_' + new Date().getTime();
                $scope.inProgress = [];

                $scope.remove = removeAttach;

                var uploader = $scope.uploader = new FileUploader({
                    withCredentials: false,
                    disableMultipart: true,
                    method: 'PUT',
                    removeAfterUpload: true,
                    autoUpload: false
                });

                uploader.onAfterAddingFile = function (item) {

                    if ($scope.formName && $scope[$scope.formName] && $scope[$scope.formName].$$parentForm) {
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
                            'Content-Disposition': 'attachment; filename*=UTF-8\'\'' + encodeURIComponent(
                                item.file.name),
                            'Content-Type': item.file.type
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
                            $scope.field.attachments.push({
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
                    var item = $scope.field.attachments[idx],
                        essenceId = $scope.field.essenceId,
                        entityId = $scope.field.answerId;

                    greyscaleUploadApi.remove(item.id, essenceId, entityId)
                        .then(function () {
                            return $scope.field.attachments.splice(idx, 1);
                        })
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
