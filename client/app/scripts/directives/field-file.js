/**
 * Created by igi on 29.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('fieldFile', function (greyscaleSurveyAnswerApi) {
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
                            var _obj = {
                                filename: file.name,
                                size: file.size,
                                mimetype: file.type,
                                body: _data
                            };
                            greyscaleSurveyAnswerApi.addAttach(attrs.answerId, _obj);
                            _scope.files.push(_obj);
                        });
                    };
                    reader.readAsDataURL(file);
                }
            }
        };
    });
