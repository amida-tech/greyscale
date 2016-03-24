/**
 * Created by igi on 24.03.16.
 */
'use strict';
angular.module('greyscale.core')
    .factory('greyscaleRealmSrv', function ($cookieStore, $log) {
        var _realm = null,
            _default = 'public';
        
        return function (val) {
            if (typeof val !== 'undefined' && val !== _default) {
                if (val) {
                    $cookieStore.put('realm', val);
                    $log.debug('set realm to', val);
                } else {
                    $log.debug('removed realm', _realm);
                    $cookieStore.remove('realm');
                }
                _realm = val || _default;
            } else {
                if (!_realm) {
                    _realm = $cookieStore.get('realm') || _default;
                    $log.debug('restored realm', _realm);
                }
            }
            return _realm;
        };
    });
