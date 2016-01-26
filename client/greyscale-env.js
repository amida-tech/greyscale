angular.module('greyscale.core')

.constant('greyscaleEnv', {name:'docker',baseServerUrl: window.location.protocol + '//' + window.location.host+'/api/'+window.location.hostname.split('.')[0]+'/v0.2',defaultUser:'no@mail.net',defaultPassword:'testuser',enableDebugLog:true})

;
