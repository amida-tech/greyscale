/**
 * Created by igi on 17.05.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('policyBlock', function () {
        var _headers = ['SECTION', 'SUBSECTION', 'NUMBER', 'TITLE', 'TYPE', 'AUTHOR'];

        return {
            restrict: 'E',
            templateUrl: 'views/directives/policy-block.html',
            scope: {
                policyData: '=?'
            },
            controller: function ($scope, $element, greyscaleUtilsSrv, FileUploader, $timeout, greyscaleTokenSrv,
                greyscaleGlobals) {

                var _url = greyscaleUtilsSrv.getApiBase('surveys/parsedocx'),
                    _token = greyscaleTokenSrv();

                $scope.formName = 'f_' + new Date().getTime();

                $scope.model = $scope.model || {};

                $scope.inProgress = [];

                var uploader = $scope.uploader = new FileUploader({
                    url: _url,
                    withCredentials: false,
                    method: 'POST',
                    removeAfterUpload: true,
                    autoUpload: true,
                    filters: [{
                        name: 'docx',
                        fn: _isDocx
                    }]
                });

                uploader.onAfterAddingFile = _addedFile;

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
                    if (!item.isError) {
                        if (data.headers) {
                            _loadHeaders(data.headers);
                        }
                        if (data.sections) {
                            _loadSections(data.sections);
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

                uploader.onWhenAddingFileFailed = _addingFileFailed;

                function _modifyEvt() {
                    $scope.$emit(greyscaleGlobals.events.survey.answerDirty);
                }

                function _loadSections(data) {
                    var _sectionName,
                        i = 0;

                    for (_sectionName in data) {
                        if ($scope.policyData.sections.length <= i) {
                            $scope.policyData.sections.push({
                                label: '',
                                description: ''
                            });
                        }
                        if (data.hasOwnProperty(_sectionName) && $scope.policyData.sections[i]) {
                            $scope.policyData.sections[i].label = _sectionName || $scope.policyData.sections[i].label;
                            $scope.policyData.sections[i].description = data[_sectionName];
                            i++;
                        }
                    }
                }

                function _loadHeaders(headers) {
                    var i, key,
                        qty = _headers.length;

                    for (i = 0; i < qty; i++) {
                        key = _headers[i];
                        if (headers.hasOwnProperty(key)) {
                            $scope.policyData[key.toLowerCase()] = headers[key];
                        }
                    }
                }

                function _addedFile() {
                    $scope.model.error = null;
                }

                function _addingFileFailed(item, filter) {
                    $scope.model.error = {
                        msg: 'ERROR.NOT_DOCX'
                    };
                }

                function _isDocx(item) {
                    var re = /.+\.docx$/i;
                    return re.test(item.name);
                }
            }
        };

    });
