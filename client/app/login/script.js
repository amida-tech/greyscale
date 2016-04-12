/**
 * Created by igi on 12.04.16.
 */
(function(){
    'use strict';
    var baseUrl = '';

    $.ready().then(function(){
        $.include(window.greyscaleEnv, '/m/config.js').then(function(){

        });
    });

    function listLocales() {
        return $.fetch(url, { method: 'GET', responseType: 'json'})
            .then(function(req) {
                return req.response;
            });
    }
})();
