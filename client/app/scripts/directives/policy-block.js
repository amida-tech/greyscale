/**
 * Created by igi on 17.05.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('policyBlock', function () {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/policy-block.html',
            scope: {
                policyData: '=?'
            },
            link: function (scope) {
                scope.$watch('policyData', function (data) {
                    if (data) {
                        _refreshPolicy(scope, data);
                    }
                });
            },
            controller: function ($scope, $element, greyscaleUtilsSrv, FileUploader, $timeout, greyscaleTokenSrv,
                greyscaleGlobals) {

                var _url = greyscaleUtilsSrv.getApiBase('surveys/parsedocx'),
                    _token = greyscaleTokenSrv();

                $scope.formName = 'f_' + new Date().getTime();

                $scope.model = $scope.model || [];

                $scope.inProgress = [];

                var uploader = $scope.uploader = new FileUploader({
                    url: _url,
                    withCredentials: false,
                    method: 'POST',
                    removeAfterUpload: true,
                    autoUpload: true
                });

                uploader.onBeforeUploadItem = function (item) {
                    if ($scope.formName && $scope[$scope.formName].$$parentForm) {
                        $scope[$scope.formName].$$parentForm.$dirty = false;
                    }
                    item.headers.token = _token;
                    item.formData = [{
                        essenceId: $scope.essenceId,
                        entityId: $scope.itemId
                    }];
                    item.idx = $scope.inProgress.length;
                    $scope.inProgress.push(item);
                };

                uploader.onCompleteItem = function (item, data) {
                    var _sectionName,
                        i = 0;
                    if (!item.isError) {
                        for (_sectionName in data) {
                            if ($scope.policyData.sections.length <= i) {
                                $scope.policyData.sections.push({
                                    label: '',
                                    description: ''
                                });
                            }
                            if (data.hasOwnProperty(_sectionName) && $scope.policyData.sections[i]) {
                                $scope.policyData.sections[i].label = _sectionName;
                                $scope.policyData.sections[i].description = data[_sectionName];
                                i++;
                            }
                        }
                        _modifyEvt();
                    }

                    uploader.clearQueue();
                    $element.find('form')[0].reset();
                    $scope.inProgress.splice(item.idx, 1);
                    $timeout(function () {
                        $scope.$digest();
                    });
                };

                uploader.onErrorItem = function (file, response) {
                    greyscaleUtilsSrv.errorMsg(response || 'File too big', 'Upload file');
                };

                function _modifyEvt() {
                    $scope.$emit(greyscaleGlobals.events.survey.answerDirty);
                }
            }
        };

        function _refreshPolicy(scope, data) {}
    });
