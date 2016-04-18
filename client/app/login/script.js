/**
 * Created by igi on 12.04.16.
 */
(function () {
    'use strict';

    $.ready()
        .then(function () {
            return $.include(window.Greyscale, '/m/greyscale.js')
                .then(init);
        });

    function init() {
        if (greyscaleEnv.defaultUser) {
            $('#login').value = greyscaleEnv.defaultUser;
        }
        if (greyscaleEnv.defaultPassword) {
            $('#pass').value = greyscaleEnv.defaultPassword;
        }

        $('#login-btn')._.events({'click': login});
        return true;
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
})();
