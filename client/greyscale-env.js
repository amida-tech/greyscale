angular
    .module('greyscale.core')
    .constant('greyscaleEnv', {
        name:'docker',
        apiProtocol: window.location.protocol.substring(0,window.location.protocol.length-1),
        apiHostname: window.location.host,
        apiRealm: 'api/public',
        apiVersion: 'v0.2',
        defaultUser:'',
        defaultPassword:'',
        enableDebugLog:true
    });
