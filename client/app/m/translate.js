(function () {
    'use strict';
    $.ready().then(function(){
        $.include(window.greyscaleEnv, '/m/config.js').then(function () {
            console.log(window.greyscaleEnv);
        });
    });

})();
