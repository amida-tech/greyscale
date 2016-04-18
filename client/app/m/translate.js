(function () {
    'use strict';
    $.ready()
        .then(function () {
            return $.include(window.Greyscale, '/m/config.js')
                .then(init);
        });

    function init() {
        var _locale = Greyscale.getCookie('locale') || 'en';
        var script = document.createElement('script');
        script.src = '/l10n/' + _locale + '.js';
        document.head.appendChild(script);
        script.onreadystatechange = script.onload = proceed;
        window.Greyscale = window.Greyscale || {};
        window.Greyscale.translate = translate;
    }

    function translate(key, params) {
        var _res = key,
            _path = key.split('.'),
            qty = _path.length,
            _tmp, k, _key;

        if (L10N) {
            _tmp = L10N;
            for (k = 0; k < qty && typeof _tmp[_path[k]] !== 'undefined'; k++) {
                _tmp = _tmp[_path[k]];
            }
            if (k === qty) {
                if (params) {
                    for (_key in params) {
                        if (params.hasOwnProperty(_key)) {
                            _tmp = _tmp.split('{{' + _key + '}}').join(params[_key]);
                        }
                    }
                }
                _res = _tmp;
            }
        }
        return _res;
    }

    function proceed() {
        var e, _elem, _key, _params,
            _elems = $$('[data-translate]'),
            qty = _elems.length;

        for (e = 0; e < qty; e++) {
            _elem = _elems[e];
            _key = _elem.attributes['data-translate'].value;
            _params = _elem.attributes['data-translate-values'];
            if (_params) {
                _params = JSON.parse(_params.value);
            }
            _elem.innerHTML = translate(_key, _params);
        }
    }

})();
