/**
 * Created by igi on 12.04.16.
 */
(function () {
    'use strict';

    var _urls = {
        chkToken: '/users/checkToken',
        login: '/users/token',
        remind: '/users/forgot',
        languages: '/languages'
    };

    $.ready()
        .then(function () {
            return $.include(window.greyscaleEnv, '/m/config.js')
                .then(function () {
                    window.Greyscale = window.Greyscale || {
                        getApiUrl: _getApiUrl,
                        getBaseUrl: _getBaseUrl,
                        setCookie: _setCookie,
                        getCookie: _getCookie,
                        showRealmSelector: _showOrgs,
                        showErr: _showErr
                    };
                    $('#org')._.events({'change': _setRealm});

                    return true;
                });
        });

    function _getBaseUrl() {
        if (greyscaleEnv) {
            var _realm = _getCookie('current_realm') || greyscaleEnv.adminSchema;
            var host = [greyscaleEnv.apiHostname, greyscaleEnv.apiPort].join(':');
            var path = [_realm, greyscaleEnv.apiVersion].join('/');
            return (greyscaleEnv.apiProtocol || 'http') + '://' + host + '/' + path;
        } else {
            console.log('config not loaded');
            return '';
        }
    }

    function _getApiUrl(apiName) {
        return _getBaseUrl() + _urls[apiName];
    }

    function _setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toGMTString();
        document.cookie = cname + "=" + cvalue + ";path=/;" + expires;
    }

    function _getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    function _showOrgs(orgs) {
        var o, option,
            qty = orgs.length,
            _select = $('#org');

        $$('#org option').forEach(function (_opt) {
            _opt.remove();
        });

        option = $.create('option', {text: '', value: null, selected: true, disabled: 'disabled', hidden: 'hidden'});
        $.inside(option, _select);
        for (o = 0; o < qty; o++) {
            option = $.create('option', {
                text: orgs[o].orgName,
                value: orgs[o].realm
            });
            $.inside(option, _select);
        }

        $('#realm-wrp').classList.remove('hidden');
    }

    function _showErr(err) {
        var _elem = $('#err-wrp'),
            _msg = err;
        if (err && err.xhr) {
            _msg = (err.xhr.response && err.xhr.response.message) ? err.xhr.response.message : err.xhr.statusText;
        }
        _elem.innerHTML = '<i class="fa fa-exclamation-circle"> ' + _msg + '</i>';
        _elem.classList.remove('hidden');
    }

    function _setRealm() {
        var _select = $('#org');
        if (_select && _select.value) {
            Greyscale.setCookie('current_realm', _select.value, 1);
        }
    }
})();
