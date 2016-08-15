/**
 * Created by igi on 10.05.16.
 */
'use strict';
angular.module('greyscale.wysiwyg', ['textAngular', 'ui.bootstrap']).config(function ($provide) {
    $provide.decorator('taOptions', ['taRegisterTool', 'taSelection', '_', '$delegate',
        function (taRegisterTool, taSelection, _, taOptions) {

            taRegisterTool('colour', {
                iconclass: 'fa fa-square text-danger',
                tooltiptext: 'Text colour',
                action: function () {
                    this.$editor().wrapSelection('forecolor', 'red');
                }
            });

            taRegisterTool('olType', {
                display: '<gs-ol-types class="bar-btn-dropdown dropdown"></gs-ol-types>',
                options: [{
                    key: '1',
                    title: '1,2,3...',
                    hint: 'indicates numbers (default)'
                }, {
                    key: 'a',
                    title: 'a,b,c...',
                    hint: 'indicates lowercase letters'
                }, {
                    key: 'A',
                    title: 'A,B,C...',
                    hint: 'indicates uppercase letters'
                }, {
                    key: 'i',
                    title: 'i,ii,iii...',
                    hint: 'indicates lowercase Roman numerals'
                }, {
                    key: 'I',
                    title: 'I,II,III...',
                    hint: 'indicates uppercase Roman numerals'
                }],
                tooltiptext: 'Ordered List',
                action: function (def) {
                    var _olElem,
                        _activeType = this.getActive(),
                        _isOl = this.$editor().queryCommandState('insertOrderedList'),
                        _self = this;

                    def.promise.then(__setOlType);

                    if (_isOl) {
                        _olElem = this._getOlElem(angular.element(taSelection.getSelectionElement()));
                    }

                    if (!_isOl || _olElem.type === this.getActive()) { //toggle ol
                        _isOl = !_isOl;
                        return this.$editor().wrapSelection('insertOrderedList', null);
                    } else {
                        return __setOlType();
                    }

                    function __setOlType() {
                        if (_isOl) {
                            _olElem = _self._getOlElem(angular.element(taSelection.getSelectionElement()));
                            if (_olElem.elem) {
                                _olElem.elem.setAttribute('type', _activeType.key);
                            }
                        }
                        return false;
                    }
                },
                _getOlElem: function (elem) {
                    var _ol, _olType;
                    _ol = angular.element(elem).closest('ol');
                    if (_ol.length) {
                        _olType = _.find(this.options, {
                            key: _ol[0].getAttribute('type') || '1'
                        });
                    }
                    return {
                        elem: _ol[0],
                        type: _olType
                    };
                },
                setType: function (type) {
                    if (this.type) {
                        this.type.active = false;
                    }
                    type.active = true;
                    this.tooltiptext = type.hint;
                },
                getActive: function () {
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
                activeState: function (commonElement) {
                    var res = this.$editor().queryCommandState('insertOrderedList');

                    if (res) {
                        var _ol = this._getOlElem(commonElement);
                        if (_ol.type) {
                            this.setType(_ol.type);
                        }
                        this.type = this.getActive();
                    } else {
                        //this.setType(this.options[0]); //reset to default type;
                    }
                    return res;
                }
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
                ['colour', 'bold', 'italics', 'underline', 'strikeThrough'],
                ['ul', 'olType'],
                ['redo', 'undo', 'clear']
            ];

            return taOptions;
        }
    ]);
});
