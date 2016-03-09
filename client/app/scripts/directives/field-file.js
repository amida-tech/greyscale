/**
 * Created by igi on 29.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('fieldFile', function (greyscaleSurveyAnswerApi, $log) {
        return {
            restrict: 'A',
            scope: {
                files: '=fieldFile'
            },
            link: function (scope, elem, attrs) {
                elem.bind('change', addFiles);

                function addFiles(fileEvt) {
                    var file = fileEvt.currentTarget.files[0];
                    var reader = new window.FileReader();
                    reader.onload = function onFileLoad() {
                        scope.$apply(function (_scope) {
                            var _data = reader.result.substr(reader.result.indexOf(',') + 1);
                            greyscaleSurveyAnswerApi.addAttach(attrs.answerId, {
                                filename: file.name,
                                size: file.size,
                                mimetype: file.type,
                                body: _data
                            });
                            _scope.files.push({
                                name: file.name,
                                size: file.size,
                                modified: file.lastModifiedDate,
                                type: file.type,
                                data: _data
                            });
                        });
                    };
                    reader.readAsDataURL(file);
                }
            }
        };
    });
