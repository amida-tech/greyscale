/**
 * Created by igi on 10.05.16.
 */
'use strict';
angular.module('greyscale.wysiwyg', ['textAngular'])
    .config(function ($provide) {
        var _red = '#ff0000';

        $provide.decorator('taOptions', ['taRegisterTool', '$delegate', function (taRegisterTool, taOptions) {
            taRegisterTool('markRed', {
                iconclass: 'fa fa-square text-danger',
                tooltiptext: 'Mark red',
                action: function () {
                    if (this.active) {
                        this.$editor().wrapSelection('removeFormat', 'foreColor');
                    } else {
                        this.$editor().wrapSelection('foreColor', _red);
                    }
                },
                activeState: _isRed
            });
            /*
             toolbar: [
             ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
             ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
             ['justifyLeft','justifyCenter','justifyRight','justifyFull','indent','outdent'],
             ['html', 'insertImage', 'insertLink', 'insertVideo', 'wordcount', 'charcount']
             ],
             */
            taOptions.toolbar = [
                ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                ['markRed', 'bold', 'italics', 'underline', 'strikeThrough'],
                ['ul', 'ol'],
                ['redo', 'undo', 'clear']
            ];

            return taOptions;

            function _isRed(elem) {
                var res = false;
                if (elem && elem.nodeName === '#document') {
                    return false;
                }
                if (elem) {
                    res = elem.attr('color') === _red ||
                        elem.attr('color') === 'red' ||
                        elem.css('color') === 'rgb(255, 0, 0)';
                }
                return res;
            }
        }]);
    });
