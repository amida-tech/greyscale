/**
 * Created by igi on 10.05.16.
 */
'use strict';
angular.module('greyscale.wysiwyg', ['textAngular'])
    .config(function ($provide) {
        $provide.decorator('taOptions', ['taRegisterTool', '$delegate', function (taRegisterTool, taOptions) {
            /*
             toolbar: [
             ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
             ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
             ['justifyLeft','justifyCenter','justifyRight','justifyFull','indent','outdent'],
             ['html', 'insertImage', 'insertLink', 'insertVideo', 'wordcount', 'charcount']
             ],
             */
            taOptions.toolbar = [
                ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
                ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear']
            ];

            taRegisterTool('colour', {
                iconclass: 'fa fa-square text-danger',
                tooltiptext: 'Text colour',
                action: function () {
                    this.$editor().wrapSelection('forecolor', 'red');
                }
            });
            taOptions.toolbar[0].push('colour');
            return taOptions;

        }]);
    });
