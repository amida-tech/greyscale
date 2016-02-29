/**
 * Created by igi on 29.02.16.
 */
'use strict';
angular.module('greyscaleApp')
    .directive('fieldFile', function () {
        return {
            restrict: 'A',
            scope: {
                files: '=fieldFile'
            },
            link: function (scope, elem) {
                elem.bind('change', addFiles);

                function addFiles(file_evt) {
                    var file, f,
                        fQty = file_evt.currentTarget.files.length;

                    for (f = 0; f < fQty; f++) {
                        file = file_evt.currentTarget.files[f];
                        var reader = new FileReader();
                        reader.onload = function onFileLoad(reader_evt) {
                            scope.$apply(function (_scope) {
                                var _data = reader.result.substr(reader.result.indexOf(',') + 1);
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
            }
        };
    });
