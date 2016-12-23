/**
 * Created by igi on 10.05.16.
 */
'use strict';
angular.module('greyscale.wysiwyg', ['textAngular', 'ui.bootstrap']).config(function ($provide) {
    $provide.decorator('taOptions', ['taRegisterTool', 'taSelection', '_', '$delegate', 'taExecCommand', 'taBrowserTag', 
        function (taRegisterTool, taSelection, _, taOptions, taExecCommand, taBrowserTag) {
            var _red = '#ff0000', _black = '#000000', _blue = "#0000ff", _green = "#00ff00";

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

            taRegisterTool('markGreen', {
                iconclass: 'fa fa-square text-green',
                tooltiptext: 'Mark Green',
                action: function () {
                    if (this.active) {
                        this.$editor().wrapSelection('removeFormat', 'foreColor');
                    } else {
                        this.$editor().wrapSelection('foreColor', _green);
                    }
                },
                activeState: function (elem) {
                    var res = false;
                    if (elem && elem.nodeName === '#document') {
                        return false;
                    }
                    if (elem) {
                        res = elem.attr('color') === _green ||
                            elem.attr('color') === 'green' ||
                            elem.css('color') === 'rgb(0, 255, 0)';
                    }
                    return res;
                }
            });

            taRegisterTool('markTab', {
                buttontext: "Insert Tab",
                tooltiptext: 'Insert Tab',
                action: function(e, elt, editorScope){
                    var selectedText = window.getSelection();
                    if(selectedText.type == 'Caret') {
                        var tabTag = '<span>&#09;</span>';
                        return this.$editor().wrapSelection('insertHTML', tabTag, true);
                    }
                    else {
                        var tabTag = '&#09;'+ selectedText;
                        return this.$editor().wrapSelection('insertHTML', tabTag, true);
                    }
                }
            });

            taRegisterTool('topMargin', {
                buttontext: "Top Margin",
                tooltiptext: 'Top Margin',
                action: function () {
                    var selectedText = window.getSelection();
                    if(selectedText.type == 'Caret') {
                        var tabTag = '<span><br /><br /></span>';
                        return this.$editor().wrapSelection('insertHTML', tabTag, true);
                    }
                    else {
                        var tabTag = '&#10;&#10;'+ selectedText;
                        return this.$editor().wrapSelection('insertHTML', tabTag, true);
                    }
                }
            });

            taRegisterTool('bottomMargin', {
                buttontext: "Bottom Margin",
                tooltiptext: 'Bottom Margin',
                action: function () {
                    var selectedText = window.getSelection();
                    if(selectedText.type == 'Caret') {
                        var tabTag = '<span><br /><br /></span>';
                        return this.$editor().wrapSelection('insertHTML', tabTag, true);
                    }
                    else {
                        var tabTag = selectedText + '&#10;&#10;';
                        return this.$editor().wrapSelection('insertHTML', tabTag, true);
                    }
                }
            });

            taRegisterTool('makeTable', {
                buttontext: "Table",
                tooltiptext: 'Table',
                action: function (def) {
                    var elem = taSelection.getSelectionElement();

                    var table = angular.element(elem).closest('table');

                    var options = "<table>";
                    /* Code for Making Tables */
                    var taDefaultWrap = taBrowserTag();
                    var turnBlockIntoBlocks = function(element, options) {
                        for(var i = 0; i<element.childNodes.length; i++) {
                            var _n = element.childNodes[i];
                            /* istanbul ignore next - more complex testing*/
                            if (_n.tagName && _n.tagName.match(BLOCKELEMENTS)) {
                                turnBlockIntoBlocks(_n, options);
                            }
                        }
                        /* istanbul ignore next - very rare condition that we do not test*/
                        if (element.parentNode === null) {
                            // nothing left to do..
                            return element;
                        }
                        /* istanbul ignore next - not sure have to test this */
                        if (options === '<br>'){
                            return element;
                        }
                        else {
                            var $target = angular.element(options);
                            $target[0].innerHTML = element.innerHTML;
                            element.parentNode.insertBefore($target[0], element);
                            element.parentNode.removeChild(element);
                            return $target;
                        }
                    };
                    var i, $target, html, _nodes, next, optionsTagName, selectedElement, ourSelection;
                    var defaultWrapper = angular.element('<' + taDefaultWrap + '>');
                    try{
                        if (taSelection.getSelection) {
                            ourSelection = taSelection.getSelection();
                        }
                        selectedElement = taSelection.getSelectionElement();
                        // special checks and fixes when we are selecting the whole container
                        var __h, _innerNode;
                        /* istanbul ignore next */
                        if (selectedElement.tagName !== undefined) {
                            if (selectedElement.tagName.toLowerCase() === 'div' &&
                                /taTextElement.+/.test(selectedElement.id) &&
                                ourSelection && ourSelection.start &&
                                ourSelection.start.offset === 1 &&
                                ourSelection.end.offset === 1) {
                                // opps we are actually selecting the whole container!
                                //console.log('selecting whole container!');
                                __h = selectedElement.innerHTML;
                                if (/<br>/i.test(__h)) {
                                    // Firefox adds <br>'s and so we remove the <br>
                                    __h = __h.replace(/<br>/i, '&#8203;');  // no space-space
                                }
                                if (/<br\/>/i.test(__h)) {
                                    // Firefox adds <br/>'s and so we remove the <br/>
                                    __h = __h.replace(/<br\/>/i, '&#8203;');  // no space-space
                                }
                                // remove stacked up <span>'s
                                if (/<span>(<span>)+/i.test(__h)) {
                                    __h = __.replace(/<span>(<span>)+/i, '<span>');
                                }
                                // remove stacked up </span>'s
                                if (/<\/span>(<\/span>)+/i.test(__h)) {
                                    __h = __.replace(/<\/span>(<\/span>)+/i, '<\/span>');
                                }
                                if (/<span><\/span>/i.test(__h)) {
                                    // if we end up with a <span></span> here we remove it...
                                    __h = __h.replace(/<span><\/span>/i, '');
                                }
                                //console.log('inner whole container', selectedElement.childNodes);
                                _innerNode = '<div>' + __h + '</div>';
                                selectedElement.innerHTML = _innerNode;
                                taSelection.setSelectionToElementEnd(selectedElement.childNodes[0]);
                                selectedElement = taSelection.getSelectionElement();
                            } else if (selectedElement.tagName.toLowerCase() === 'span' &&
                                ourSelection && ourSelection.start &&
                                ourSelection.start.offset === 1 &&
                                ourSelection.end.offset === 1) {
                                // just a span -- this is a problem...
                                //console.log('selecting span!');
                                __h = selectedElement.innerHTML;
                                if (/<br>/i.test(__h)) {
                                    // Firefox adds <br>'s and so we remove the <br>
                                    __h = __h.replace(/<br>/i, '&#8203;');  // no space-space
                                }
                                if (/<br\/>/i.test(__h)) {
                                    // Firefox adds <br/>'s and so we remove the <br/>
                                    __h = __h.replace(/<br\/>/i, '&#8203;');  // no space-space
                                }
                                // remove stacked up <span>'s
                                if (/<span>(<span>)+/i.test(__h)) {
                                    __h = __.replace(/<span>(<span>)+/i, '<span>');
                                }
                                // remove stacked up </span>'s
                                if (/<\/span>(<\/span>)+/i.test(__h)) {
                                    __h = __.replace(/<\/span>(<\/span>)+/i, '<\/span>');
                                }
                                if (/<span><\/span>/i.test(__h)) {
                                    // if we end up with a <span></span> here we remove it...
                                    __h = __h.replace(/<span><\/span>/i, '');
                                }
                                //console.log('inner span', selectedElement.childNodes);
                                // we wrap this in a <div> because otherwise the browser get confused when we attempt to select the whole node
                                // and the focus is not set correctly no matter what we do
                                _innerNode = '<div>' + __h + '</div>';
                                selectedElement.innerHTML = _innerNode;
                                taSelection.setSelectionToElementEnd(selectedElement.childNodes[0]);
                                selectedElement = taSelection.getSelectionElement();
                                //console.log(selectedElement.innerHTML);
                            } else if (selectedElement.tagName.toLowerCase() === 'p' &&
                                ourSelection && ourSelection.start &&
                                ourSelection.start.offset === 1 &&
                                ourSelection.end.offset === 1) {
                                //console.log('p special');
                                // we need to remove the </br> that firefox adds!
                                __h = selectedElement.innerHTML;
                                if (/<br>/i.test(__h)) {
                                    // Firefox adds <br>'s and so we remove the <br>
                                    __h = __h.replace(/<br>/i, '&#8203;');  // no space-space
                                    selectedElement.innerHTML = __h;
                                }
                            } else if (selectedElement.tagName.toLowerCase() === 'li' &&
                                ourSelection && ourSelection.start &&
                                ourSelection.start.offset === ourSelection.end.offset) {
                                // we need to remove the </br> that firefox adds!
                                __h = selectedElement.innerHTML;
                                if (/<br>/i.test(__h)) {
                                    // Firefox adds <br>'s and so we remove the <br>
                                    __h = __h.replace(/<br>/i, '');  // nothing
                                    selectedElement.innerHTML = __h;
                                }
                            }
                        }
                    }catch(e){}
                    if (!selectedElement){return;}
                    var $selected = angular.element(selectedElement);
                    var tagName = (selectedElement && selectedElement.tagName && selectedElement.tagName.toLowerCase()) ||
                        /* istanbul ignore next: */ "";
                    optionsTagName = options.toLowerCase().replace(/[<>]/ig, '');
                    $target = $selected;
                    // find the first blockElement
                    while(!$target[0].tagName || !$target[0].tagName.match(BLOCKELEMENTS) && !$target.parent().attr('contenteditable')){
                        $target = $target.parent();
                        /* istanbul ignore next */
                        tagName = ($target[0].tagName || '').toLowerCase();
                    }
                    if(tagName === optionsTagName){
                        // $target is wrap element
                        _nodes = $target.children();
                        var hasBlock = false;
                        for(i = 0; i < _nodes.length; i++){
                            hasBlock = hasBlock || _nodes[i].tagName.match(BLOCKELEMENTS);
                        }
                        if(hasBlock){
                            $target.after(_nodes);
                            next = $target.next();
                            $target.remove();
                            $target = next;
                        }else{
                            defaultWrapper.append($target[0].childNodes);
                            $target.after(defaultWrapper);
                            $target.remove();
                            $target = defaultWrapper;
                        }
                    }else if($target.parent()[0].tagName.toLowerCase() === optionsTagName &&
                        !$target.parent().hasClass('ta-bind')){
                        //unwrap logic for parent
                        var blockElement = $target.parent();
                        var contents = blockElement.contents();
                        for(i = 0; i < contents.length; i ++){
                            /* istanbul ignore next: can't test - some wierd thing with how phantomjs works */
                            if(blockElement.parent().hasClass('ta-bind') && contents[i].nodeType === 3){
                                defaultWrapper = angular.element('<' + taDefaultWrap + '>');
                                defaultWrapper[0].innerHTML = contents[i].outerHTML;
                                contents[i] = defaultWrapper[0];
                            }
                            blockElement.parent()[0].insertBefore(contents[i], blockElement[0]);
                        }
                        blockElement.remove();
                    }else if(tagName.match(LISTELEMENTS)){
                        // wrapping a list element
                        $target.wrap(options);
                    }else{
                        // default wrap behaviour
                        _nodes = taSelection.getOnlySelectedElements();
                        if(_nodes.length === 0) {
                            // no nodes at all....
                            _nodes = [$target[0]];
                        }
                        // find the parent block element if any of the nodes are inline or text
                        for(i = 0; i < _nodes.length; i++){
                            if(_nodes[i].nodeType === 3 || !_nodes[i].tagName.match(BLOCKELEMENTS)){
                                while(_nodes[i].nodeType === 3 || !_nodes[i].tagName || !_nodes[i].tagName.match(BLOCKELEMENTS)){
                                    _nodes[i] = _nodes[i].parentNode;
                                }
                            }
                        }
                        // remove any duplicates from the array of _nodes!
                        _nodes = _nodes.filter(function(value, index, self) {
                            return self.indexOf(value) === index;
                        });
                        // remove all whole taTextElement if it is here... unless it is the only element!
                        if (_nodes.length>1) {
                            _nodes = _nodes.filter(function (value, index, self) {
                                return !(value.nodeName.toLowerCase() === 'div' && /^taTextElement/.test(value.id));
                            });
                        }
                        if(angular.element(_nodes[0]).hasClass('ta-bind')){
                            $target = angular.element(options);
                            $target[0].innerHTML = _nodes[0].innerHTML;
                            _nodes[0].innerHTML = $target[0].outerHTML;
                        }
                        else {
                            //console.log(optionsTagName, _nodes);
                            // regular block elements replace other block elements
                            for (i = 0; i < _nodes.length; i++) {
                                var newBlock = turnBlockIntoBlocks(_nodes[i], options);
                                if (_nodes[i] === $target[0]) {
                                    $target = angular.element(newBlock);
                                }
                            }
                        }
                    }
                    taSelection.setSelectionToElementEnd($target[0]);
                    // looses focus when we have the whole container selected and no text!
                    // refocus on the shown display element, this fixes a bug when using firefox
                    $target[0].focus();

                    return this.$editor().displayElements.text[0].focus();
                },
                activeState: function(){
                    var elem = taSelection.getSelectionElement();
                    var table = angular.element(elem).closest('table');
                    if (table.length)
                        return true;
                    else
                        return false;
                }
            });

            taRegisterTool('olType', {
                display: '<gs-ol-types class="bar-btn-dropdown dropdown"></gs-ol-types>',
                options: [
                    {
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
                    }
                ],
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
                ['markBlack', 'markRed', 'markBlue', 'markGreen'],
                ['bold', 'italics', 'underline', 'strikeThrough'],
                ['makeTable', 'ul', 'olType'],
                ['markTab', 'topMargin', 'bottomMargin'],
                ['redo', 'undo', 'clearFormat']
            ];

            return taOptions;
        }
    ]);
});
