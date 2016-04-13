(function () {
    'use strict';
    $.ready()
        .then(function() {
            return $.include(window.greyscaleEnv, '/m/config.js');
        })
        .then(function () {
            /* config loaded. can init */
        });
})();
