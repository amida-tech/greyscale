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
        gsUtils.setCookie('current_realm', 'public', -1);
        $('#remind-btn')._.events({click: remind});
    }

    function remind(/* Event */ evt) {
        evt.preventDefault();

        $('#err-wrp').classList.add('hidden');

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
            .then(function () {
                $('#btn-wrp').classList.add('hidden');
                $('#realm-wrp').classList.add('hidden');
                $('#success-wrp').classList.remove('hidden');
            })
            .catch(function (err) {
                var _xhr =err.xhr,
                    _resp = (_xhr)?_xhr.response:null;
                if (_resp && _resp.e === 300) {
                    gsUtils.showRealmSelector(_resp.message);
                } else {
                    gsUtils.showErr(err);
                }
            });
    }
})();
