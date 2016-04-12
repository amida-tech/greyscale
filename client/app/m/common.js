/**
 * Created by igi on 12.04.16.
 */
'use strict';

function getBaseUrl() {
    if (window.greyscaleEnv) {
        var _realm = getCookie('current_realm') || greyscaleEnv.adminSchema;
        var host = [greyscaleEnv.apiHostname, greyscaleEnv.apiPort].join(':');
        var path = [_realm, greyscaleEnv.apiVersion].join('/');
        return (greyscaleEnv.apiProtocol || 'http') + '://' + host + '/' + path;
    }
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";path=/;" + expires;
}

function getCookie(cname) {
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
