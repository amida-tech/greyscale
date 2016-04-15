/**
 * Created by igi on 13.04.16.
 *
 * Language selector
 */
(function () {
    'use strict';
    var _list = [],
        _indexes = {};

    $.ready()
        .then(function () {
            return $.include(window.Greyscale, '/m/greyscale.js').then(init);
        });

    function init() {

        var params = {
                method: 'GET',
                responseType: 'json',
                headers: {
                    'Content-type': 'application/json'
                }
            },
            url = Greyscale.getApiUrl('languages'),
            _selector = $('#language-selector'),
            _lang_menu = $('#lang-menu');

        $.fetch(url, params)
            .then(function (xhr) {
                var l, _li, _a, _span, qty,
                    _locale = Greyscale.getCookie('locale');

                _list = xhr.response;
                qty = _list.length;

                for (l = 0; l < qty; l++) {
                    _indexes[_list[l].code] = l;
                    if (~greyscaleEnv.supportedLocales.indexOf(_list[l].code)) {
                        _span = $.create('span', {class: 'locale', textContent: _list[l].code});
                        _a = $.create('a', {
                            text: _list[l].nativeName,
                            title: _list[l].name,
                            'data-locale': _list[l].code
                        });
                        _li = $.create('li', {className: 'link'});
                        $.start(_span, _a);
                        $.inside(_a, _li);
                        $.inside(_li, _lang_menu);

                        if (_locale === _list[l].code) {
                            showLocale(_list[l].code);
                        }
                        _a._.events({click: setLocale});
                    }
                }
            });

        _selector._.events({'click': langToggle});

        return true;
    }

    function showLocale(code) {
        var l = _indexes[code] || 0;

        $('.dropdown-toggle').title = _list[l].nativeName + ' (' + _list[l].name + ')';
        $('.dropdown-toggle .locale').innerHTML = _list[l].code;

    }

    function langToggle(/*Event*/evt) {
        evt.preventDefault();
        $('#language-selector').classList.toggle('open');
    }

    function setLocale(/*Event*/evt) {
        evt.preventDefault();
        var _locale = evt.target.attributes['data-locale'].value;
        showLocale(_locale);
        Greyscale.setCookie('locale',_locale);
        window.location.reload();
    }
})();
