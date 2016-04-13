/**
 * Created by igi on 12.04.16.
 */
(function (param) {
    'use strict';

    var _urls = {
        chkToken: '/users/checkToken',
        login: '/users/token',
        remind: '/users/forgot'
    };

    window.gsUtils = {
        getApiUrl: getApiUrl,
        getBaseUrl: getBaseUrl,
        setCookie: setCookie,
        getCookie: getCookie
    };

    function getBaseUrl() {
        if (window.greyscaleEnv) {
            var _realm = getCookie('current_realm') || greyscaleEnv.adminSchema;
            var host = [greyscaleEnv.apiHostname, greyscaleEnv.apiPort].join(':');
            var path = [_realm, greyscaleEnv.apiVersion].join('/');
            return (greyscaleEnv.apiProtocol || 'http') + '://' + host + '/' + path;
        } else {
            return '';
        }
    }

    function getApiUrl(apiName) {
        return getBaseUrl() + _urls[apiName];
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

    Bliss.fetch =
        /*
         * Fetch API inspired XHR wrapper. Returns promise.
         */
        function (url, o) {
            if (!url) {
                throw new TypeError("URL parameter is mandatory and cannot be " + url);
            }

            // Set defaults & fixup arguments
            var env = $.extend({
                url: new URL(url, location),
                data: "",
                method: "GET",
                headers: {},
                xhr: new XMLHttpRequest()
            }, o);

            env.method = env.method.toUpperCase();

            $.hooks.run("fetch-args", env);

            // Start sending the request

            if (env.method === "GET" && env.data) {
                env.url.search += env.data;
            }

            document.body.setAttribute('data-loading', env.url);

            env.xhr.open(env.method, env.url.href, env.async !== false, env.user, env.password);

            for (var property in o) {
                if (property in env.xhr) {
                    try {
                        env.xhr[property] = o[property];
                    }
                    catch (e) {
                        self.console && console.error(e);
                    }
                }
            }

            if (env.method !== 'GET' && !env.headers['Content-type'] && !env.headers['Content-Type']) {
                env.xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            }

            for (var header in env.headers) {
                env.xhr.setRequestHeader(header, env.headers[header]);
            }

            return new Promise(function (resolve, reject) {
                env.xhr.onload = function () {
                    document.body.removeAttribute('data-loading');

                    if (env.xhr.status === 0 || env.xhr.status >= 200 && env.xhr.status < 300 || env.xhr.status === 304) {
                        // Success!
                        resolve(env.xhr);
                    }
                    else {
                        var err = new Error(env.xhr.statusText);
                        $.extend(err, {
                            xhr: env.xhr,
                            get data() {
                                return this.xhr.response;
                            },
                            get status() {
                                return this.xhr.status;
                            },
                            get statusText() {
                                return this.xhr.statusText
                            }
                        });
                        reject(err);
                    }

                };

                env.xhr.onerror = function () {
                    document.body.removeAttribute('data-loading');
                    reject($.extend(Error("Network Error"), {xhr: env.xhr}));
                };

                env.xhr.ontimeout = function () {
                    document.body.removeAttribute('data-loading');
                    reject($.extend(Error("Network Timeout"), {xhr: env.xhr}));
                };

                env.xhr.send(env.method === 'GET' ? null : env.data);
            });
        };
})();
