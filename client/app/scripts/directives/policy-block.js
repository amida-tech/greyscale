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
            controller: function ($scope, $element, greyscaleUtilsSrv, FileUploader, $timeout, greyscaleTokenSrv,
                greyscaleGlobals) {

                var _url = greyscaleUtilsSrv.getApiBase('surveys/parsedocx'),
                    _token = greyscaleTokenSrv();

                $scope.policyUploadForm = 'f_' + new Date().getTime();

                $scope.model = $scope.model || {};

                $scope.inProgress = [];

                var policyUploader = $scope.policyUploader = new FileUploader({
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

                policyUploader.onAfterAddingFile = _addedFile;

                policyUploader.onBeforeUploadItem = function (item) {
                    if ($scope.policyUploadForm && $scope[$scope.policyUploadForm].$$parentForm) {
                        $scope[$scope.policyUploadForm].$$parentForm.$dirty = false;
                    }
                    item.headers.token = _token;
                    item.formData = [{
                        essenceId: $scope.essenceId,
                        entityId: $scope.itemId
                    }];
                    item.idx = $scope.inProgress.length;
                    $scope.inProgress.push(item);
                };

                policyUploader.onCompleteItem = function (item, data) {
                    if (!item.isError) {
                        if (data.headers) {
                            _loadHeaders(data.headers);
                        }
                        if (data.sections) {
                            _loadSections(data.sections);
                        }
                        _modifyEvt();
                        $timeout(function () {
                            $scope.$broadcast('line-numbers-refresh');
                        });
                    }

                    policyUploader.clearQueue();
                    $element.find('form')[0].reset();
                    $scope.inProgress.splice(item.idx, 1);
                    $timeout(function () {
                        $scope.$digest();
                    });
                };

                policyUploader.onErrorItem = function (file, response) {
                    greyscaleUtilsSrv.errorMsg(response || 'File too big', 'Upload file');
                };

                policyUploader.onWhenAddingFileFailed = _addingFileFailed;

                function _modifyEvt() {
                    $scope.$emit(greyscaleGlobals.events.survey.answerDirty);
                }

                function _loadSections(data) {
                    var _sectionName,
                        i = 0;

                    for (_sectionName in data) {
                        if ($scope.model.policy.sections.length <= i) {
                            $scope.model.policy.sections.push({
                                label: '',
                                description: ''
                            });
                        }
                        if (data.hasOwnProperty(_sectionName) && $scope.model.policy.sections[i]) {
                            $scope.model.policy.sections[i].label = _sectionName ||
                                $scope.model.policy.sections[i].label;
                            $scope.model.policy.sections[i].description = data[_sectionName];
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
                            $scope.model.policy[key.toLowerCase()] = headers[key];
                        }
                    }
                }

                function _addedFile() {
                    $scope.model.policyImportError = null;
                }

                function _addingFileFailed(item, filter) {
                    $scope.model.policyImportError = {
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
