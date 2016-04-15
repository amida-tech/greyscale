/**
 * Created by igi on 12.04.16.
 */
(function () {
    'use strict';

    var _cookie = 'light_version',
        _versions = {
            light: {
                value: 'light',
                name: 'UI_TYPE.LIGHT'
            },
            full: {
                value: 'full',
                name: 'UI_TYPE.FULL'
            }
        };

    $.ready()
        .then(function () {
            return $.include(window.Greyscale, '/m/greyscale.js')
        })
        .then(init);

    function init() {
        if (greyscaleEnv.defaultUser) {
            $('#login').value = greyscaleEnv.defaultUser;
        }
        if (greyscaleEnv.defaultPassword) {
            $('#pass').value = greyscaleEnv.defaultPassword;
        }
        var _version = Greyscale.getCookie(_cookie),
            _elem = $('#version'),
            v, item, _option;

        for (item in _versions) {
            if (_versions.hasOwnProperty(item)) {
                _option = $.create('option',{value:_versions[item].value,text:_versions[item].name});
                $.inside(_option, _elem);
            }
        }

        if (_version) {
            _elem.value = _versions.light.value;
        } else {
            _elem.value = _versions.full.value;
        }

        $('#login-btn')._.events({'click': login});
        _elem._.events({'change': setVersion})
    }

    function login(evt) {
        evt.preventDefault();
        var _data = {
                user: $('#login').value,
                pass: $('#pass').value
            },
            params = {
                method: 'GET',
                responseType: 'json',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': 'Basic ' + Base64.encode(_data.user + ':' + _data.pass)
                }
            },
            url = Greyscale.getApiUrl('login');

        $.fetch(url, params)
            .then(function (xhr) {
                if (xhr.response.realm !== greyscaleEnv.adminSchema) {
                    Greyscale.setCookie('origin_realm', xhr.response.realm);
                    Greyscale.setCookie('current_realm', xhr.response.realm);
                }
                Greyscale.setCookie('token', xhr.response.token);
                window.location.href = '/';
                return true;
            })
            .catch(function (err) {
                if (err) {
                    var _xhr = err.xhr,
                        _resp = (_xhr) ? _xhr.response : null;
                    if (_resp && _resp.e === 300) {
                        Greyscale.showRealmSelector(_resp.message);
                    } else {
                        Greyscale.showErr(err);
                    }
                }
                return true;
            });

    }

    function setVersion() {
        if ($('#version').value === _versions.light.value) {
            Greyscale.setCookie(_cookie, 1);
        } else {
            Greyscale.setCookie(_cookie, 0, -1);
        }
    }
})();
