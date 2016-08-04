/**
 * Created by igi on 10.05.16.
 */
'use strict';
angular.module('greyscale.wysiwyg', ['textAngular', 'ui.bootstrap'])
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

            taRegisterTool('olType', {
                display: '<span class="bar-btn-dropdown dropdown">{{getActive().title}}' +
                '<button class="btn btn-default dropdown-toggle" type="button" ng-disabled="isDisabled()">' +
                '<i class="fa fa-caret-down"></i></button><ul class="dropdown-menu">' +
                '<li ng-repeat="o in options"><button class="checked-dropdown" type="button" ng-click="setType(o)">' +
                '<i ng-if="o.active" class="fa fa-check"></i>{{o.title}}</button></li></ul></span>',
                options: [{
                    type: '1',
                    title: '1,2,3...',
                    active: true,
                    hint: 'indicates numbers (default)'
                }, {
                    type: 'a',
                    title: 'a,b,c...',
                    hint: 'indicates lowercase letters'
                }, {
                    type: 'A',
                    title: 'A,B,C...',
                    hint: 'indicates uppercase letters'
                }, {
                    type: 'i',
                    title: 'i,ii,iii...',
                    hint: 'indicates lowercase Roman numerals'
                }, {
                    type: 'I',
                    title: 'I,II,III...',
                    hint: 'indicates uppercase Roman numerals'
                }],
                action: function (defer) {
                    console.log('action fired', defer);
                },
                setType: function (type) {
                    this.type.active = false;
                    type.active = true;
                    console.log('setType fired', type);
                },
                getActive: function() {
                    var o,
                        qty = this.options.length;
                    this.type = this.options[0];

                    for (o = 0; o < qty; o++) {
                        if (this.options[o].active) {
                            this.type = this.options[o];
                        }
                    }
                    return this.type;
                },
                activeState: function () {
                    console.log('activeState fired');
                    this.type = this.getActive();
                    return false;
                }
            });

            taOptions.toolbar[0].push('colour', 'olType');
            return taOptions;

        }]);
    });
