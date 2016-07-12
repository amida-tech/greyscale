(function(){'use strict'; window.greyscaleEnv = {
    "name": "docker",
    "supportedLocales": [
        "en",
        "ru",
        "es",
        "fr"
    ],
    "apiProtocol": window.location.protocol.substring(0, window.location.protocol.length - 1),
    "apiHostname": window.location.host,
    "apiPort": 80,
    "apiVersion": "v0.2",
    "adminSchema": "public",
    "tokenTTLsec": 300,
    "enableDebugLog": true
};
})();