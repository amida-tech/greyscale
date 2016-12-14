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
                greyscaleGlobals, greyscaleModalsSrv, $state) {

                var _url = greyscaleUtilsSrv.getApiBase('surveys/parsedocx'),
                    _token = greyscaleTokenSrv();

                $scope.formName = 'f_' + new Date().getTime();

                $scope.model = $scope.model || {};

                $scope.inProgress = [];

                $scope.listVersions = _listVersions;
                $scope.printPDF = _printPDF;

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
                        $timeout(function () {
                            $scope.$broadcast('line-numbers-refresh');
                        });
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

                function _printPDF() {
                    var pdf = new jsPDF('p', 'pt', 'a4');

                    var specialElementHandlers = {
                      // element with id of "bypass" - jQuery style selector
                      '#ignorePDF': function(element, renderer) {
                        // true = "handled elsewhere, bypass text extraction"
                        return true;
                      }
                    };

                    var html = '<div><b>Policy Title: </b>' + $scope.policyData.title + '</div>';
                    html += '<div><b>Section: </b>' + $scope.policyData.section + '</div>';
                    html += '<div><b>Subsection: </b>' + $scope.policyData.subsection + '</div>';
                    html += '<div><b>Number: </b>' + $scope.policyData.number + '</div>';
                    html += '<div><b>Author: </b>' + $scope.policyData.authorName + '</div>';
                    $scope.policyData.sections.forEach(function(element) {
                        html += '<p>-------------</p><div><b>' + element.label + '</b>';
                        var description = $("<div class='root' style='padding: 15px;position: relative'>" + element.description + "</div>");
                        for(i=0; i < description[0].childNodes.length; i++) {
                            var element = description[0].childNodes.item(i);
                            if(element.tagName.toLowerCase() == "p")
                                element.classList.add("ln");
                        }
                        var elements = $(".ln", description);
                        for(i=0; i < elements.length; i++) {
                            var span = document.createElement('span');
                            span.innerHTML = (i + 1) + ' : ';
                            elements[i].prepend(span);
                        }
                        html += description.html().replace(/[\u0100-\uFFFF]/g,'');

                        html += '</div>';
                    })
                    console.log(html);
                    pdf.fromHTML(html, 20, 20, {
                        'width': 500,
                        'elementHandlers': specialElementHandlers
                    });
                    pdf.save('policy.pdf');
                }

                function _modifyEvt() {
                    $scope.$emit(greyscaleGlobals.events.survey.answerDirty);
                }

                function _loadSections(data) {
                    var _sectionName,
                        i = 0,
                        qty = $scope.policyData.sections.length;

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
                            $scope.policyData.options.canImport = $scope.policyData.options.canImport &&
                                (!data[_sectionName]);
                            i++;
                        }
                    }

                    if (i) { //if one or more sections were imported
                        if ($scope.policyData.id) {
                            for (; i < qty; i++) {
                                $scope.policyData.sections[i].deleted = true;
                            }
                        } else {
                            $scope.policyData.sections.splice(i);
                        }
                    } else {
                        greyscaleUtilsSrv.errorMsg('ERROR.NO_POLICY_SECTIONS');
                    }
                }

                function _loadHeaders(headers) {
                    var i, key,
                        qty = _headers.length;

                    if (qty) {
                        for (i = 0; i < qty; i++) {
                            key = _headers[i];
                            if (headers.hasOwnProperty(key)) {
                                $scope.policyData[key.toLowerCase()] = headers[key];
                            }
                        }
                    } else {
                        greyscaleUtilsSrv.errorMsg('ERROR.NO_POLICY_HEADERS');
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

                function _listVersions() {
                    greyscaleModalsSrv.selectPolicyVersion($scope.policyData.survey, 1)
                        .then(function (_survey) {
                            if (_survey) {
                                $state.go('policy.version', {
                                    id: _survey.id,
                                    version: _survey.surveyVersion
                                });
                            }
                        });
                }
            }
        };

    });
