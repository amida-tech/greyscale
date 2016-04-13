/**
 * Created by igi on 12.04.16.
 */
(function () {

    $.ready()
        .then(function () {
            return $.include(window.greyscaleEnv, '/m/config.js');
        })
        .then(init);

    function init() {
        if (greyscaleEnv.defaultUser) {
            $('#login').value = greyscaleEnv.defaultUser;
        }
        $('#main-login-btn')._.events({click: remind});
        $('#org')._.events({'change': setRealm});
    }

    function showOrgs(orgs) {
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

        $('#realm-wrapper').classList.remove('hidden');
    }

    function remind(/* Event */ evt) {
        evt.preventDefault();

        $('#err-wrapper').classList.add('hidden');

        var _data = {
                email: $('#login').value
            },
            remindOpt = {
                method: 'POST',
                responseType: 'json',
                headers: {'Content-type': 'application/json'},
                data: JSON.stringify(_data)
            },
            url = gsUtils.getApiUrl('remind');

        $.fetch(url, remindOpt)
            .then(function (resp) {
                $('#btn-wrp').classList.add('hidden');
                $('#realm-wrapper').classList.add('hidden');
                $('#success-wrp').classList.remove('hidden');
            })
            .catch(function (err) {
                if (err && err.data && err.data.e === 300) {
                    showOrgs(err.data.message);
                } else {
                    showErr(err);
                }
            });
    }

    function setRealm() {
        var _select = $('#org');
        if (_select && _select.value) {
            console.log('relam', _select.value);
            gsUtils.setCookie('current_realm', _select.value, 1);
        }
    }

    function showErr(err) {
        var _elem = $('#err-wrapper');
        _elem.innerHTML = '<i class="fa fa-exclamation-circle"> ' + (err.data && err.data.message ? err.data.message: err.statusText) + '</i>';
        _elem.classList.remove('hidden');
    }
})();
