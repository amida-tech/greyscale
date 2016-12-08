/**
 * Created by igi on 10.05.16.
 */
'use strict';
angular.module('greyscale.wysiwyg', ['textAngular', 'ui.bootstrap']).config(function ($provide) {
    $provide.decorator('taOptions', ['taRegisterTool', 'taSelection', '_', '$delegate',
        function (taRegisterTool, taSelection, _, taOptions) {
            var _red = '#ff0000', _black = '#000000', _blue = "#0000ff", _yellow = "#ffff00";

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
                activeState: function (elem) {
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
            });

            taRegisterTool('markBlack', {
                iconclass: 'fa fa-square text-black',
                tooltiptext: 'Mark Black',
                action: function () {
                    if (this.active) {
                        this.$editor().wrapSelection('removeFormat', 'foreColor');
                    } else {
                        this.$editor().wrapSelection('foreColor', _black);
                    }
                },
                activeState: function (elem) {
                    var res = false;
                    if (elem && elem.nodeName === '#document') {
                        return false;
                    }
                    if (elem) {
                        res = elem.attr('color') === _black ||
                            elem.attr('color') === 'black' ||
                            elem.css('color') === 'rgb(0, 0, 0)';
                    }
                    return res;
                }
            });

            taRegisterTool('markBlue', {
                iconclass: 'fa fa-square text-blue',
                tooltiptext: 'Mark Blue',
                action: function () {
                    if (this.active) {
                        this.$editor().wrapSelection('removeFormat', 'foreColor');
                    } else {
                        this.$editor().wrapSelection('foreColor', _blue);
                    }
                },
                activeState: function (elem) {
                    var res = false;
                    if (elem && elem.nodeName === '#document') {
                        return false;
                    }
                    if (elem) {
                        res = elem.attr('color') === _blue ||
                            elem.attr('color') === 'blue' ||
                            elem.css('color') === 'rgb(0, 0, 255)';
                    }
                    return res;
                }
            });

            taRegisterTool('markYellow', {
                iconclass: 'fa fa-square text-yellow',
                tooltiptext: 'Mark Yellow',
                action: function () {
                    if (this.active) {
                        this.$editor().wrapSelection('removeFormat', 'foreColor');
                    } else {
                        this.$editor().wrapSelection('foreColor', _yellow);
                    }
                },
                activeState: function (elem) {
                    var res = false;
                    if (elem && elem.nodeName === '#document') {
                        return false;
                    }
                    if (elem) {
                        res = elem.attr('color') === _yellow ||
                            elem.attr('color') === 'blue' ||
                            elem.css('color') === 'rgb(255, 255, 0)';
                    }
                    return res;
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

            taRegisterTool('clearFormat', {
                buttontext: 'Clear Format',
                tooltiptext: "Clear Format",
                action: function(deferred, restoreSelection){
                    var i;
                    this.$editor().wrapSelection("removeFormat", null);
                    var possibleNodes = angular.element(taSelection.getSelectionElement());
                    // remove lists
                    var removeListElements = function(list){
                        list = angular.element(list);
                        var prevElement = list;
                        angular.forEach(list.children(), function(liElem){
                            var newElem = angular.element('<p></p>');
                            newElem.html(angular.element(liElem).html());
                            prevElement.after(newElem);
                            prevElement = newElem;
                        });
                        list.remove();
                    };
                    angular.forEach(possibleNodes.find("ul"), removeListElements);
                    angular.forEach(possibleNodes.find("ol"), removeListElements);
                    if(possibleNodes[0].tagName.toLowerCase() === 'li'){
                        var _list = possibleNodes[0].parentNode.childNodes;
                        var _preLis = [], _postLis = [], _found = false;
                        for(i = 0; i < _list.length; i++){
                            if(_list[i] === possibleNodes[0]){
                                _found = true;
                            }else if(!_found) _preLis.push(_list[i]);
                            else _postLis.push(_list[i]);
                        }
                        var _parent = angular.element(possibleNodes[0].parentNode);
                        var newElem = angular.element('<p></p>');
                        newElem.html(angular.element(possibleNodes[0]).html());
                        if(_preLis.length === 0 || _postLis.length === 0){
                            if(_postLis.length === 0) _parent.after(newElem);
                            else _parent[0].parentNode.insertBefore(newElem[0], _parent[0]);

                            if(_preLis.length === 0 && _postLis.length === 0) _parent.remove();
                            else angular.element(possibleNodes[0]).remove();
                        }else{
                            var _firstList = angular.element('<'+_parent[0].tagName+'></'+_parent[0].tagName+'>');
                            var _secondList = angular.element('<'+_parent[0].tagName+'></'+_parent[0].tagName+'>');
                            for(i = 0; i < _preLis.length; i++) _firstList.append(angular.element(_preLis[i]));
                            for(i = 0; i < _postLis.length; i++) _secondList.append(angular.element(_postLis[i]));
                            _parent.after(_secondList);
                            _parent.after(newElem);
                            _parent.after(_firstList);
                            _parent.remove();
                        }
                        taSelection.setSelectionToElementEnd(newElem[0]);
                    }
                    // clear out all class attributes. These do not seem to be cleared via removeFormat
                    var $editor = this.$editor();
                    var recursiveRemoveClass = function(node){
                        node = angular.element(node);
                        if(node[0] !== $editor.displayElements.text[0]) node.removeAttr('class');
                        angular.forEach(node.children(), recursiveRemoveClass);
                    };
                    angular.forEach(possibleNodes, recursiveRemoveClass);
                    // check if in list. If not in list then use formatBlock option
                    if(possibleNodes[0].tagName.toLowerCase() !== 'li' &&
                        possibleNodes[0].tagName.toLowerCase() !== 'ol' &&
                        possibleNodes[0].tagName.toLowerCase() !== 'ul') this.$editor().wrapSelection("formatBlock", "default");
                    restoreSelection();
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
                ['markBlack', 'markRed', 'markBlue', 'markYellow'],
                ['bold', 'italics', 'underline', 'strikeThrough'],
                ['ul', 'olType'],
                ['redo', 'undo', 'clearFormat']
            ];

            return taOptions;
        }
    ]);
});
