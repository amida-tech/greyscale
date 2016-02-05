angular
    .module('greyscale.core')
    .constant('greyscaleEnv', {
        name:'docker',
        apiProtocol: window.location.protocol.substring(0,window.location.protocol.length-1),
        apiHostname: window.location.host,
        apiRealm: 'api/' + window.location.hostname.split('.')[0],
        apiVersion: 'v0.2',
        defaultUser:'no@mail.net',
        defaultPassword:'testuser',
        enableDebugLog:true
    });
