/**
 * Created by igi on 12.04.16.
 */
(function () {
    'use strict';
    var baseUrl = '';

    $.ready()
        .then(function () {
            return $.include(window.greyscaleEnv, '/m/config.js')
        })
        .then(init);

    function init() {
        if (greyscaleEnv.defaultUser) {
            $('#login').value = greyscaleEnv.defaultUser;
        }
        if (greyscaleEnv.defaultPassword) {
            $('#pass').value = greyscaleEnv.defaultPassword;
        }

        $('#login-btn')._.events({'click': login});
        $('#version')._.events({'change': setVersion})
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
            url = gsUtils.getApiUrl('login');

        $.fetch(url, params)
            .then(function (xhr) {
                if (xhr.response.realm !== greyscaleEnv.adminSchema) {
                    gsUtils.setCookie('origin_realm', JSON.stringify(xhr.response.realm));
                    gsUtils.setCookie('current_realm', JSON.stringify(xhr.response.realm));
                }
                gsUtils.setCookie('token',JSON.stringify(xhr.response.token));
                window.location.href = '/';
                return true;
            })
            .catch(function (err) {
                if (err) {
                    var _xhr = err.xhr,
                        _resp = (_xhr) ? _xhr.response : null;
                    if (_resp && _resp.e === 300) {
                        gsUtils.showRealmSelector(_resp.message);
                    } else {
                        gsUtils.showErr(err);
                    }
                }
                return true;
            });

    }

    function setVersion() {
        console.log('UI version changed');
    }
})();
