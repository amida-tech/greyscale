/**
 * Created by igi on 24.03.16.
 */
'use strict';
angular.module('greyscale.core')
    .factory('greyscaleRealmSrv', function ($cookieStore, greyscaleEnv, greyscaleGlobals) {
        var _realm,
            _default = greyscaleEnv.adminSchema || greyscaleGlobals.adminSchema;

        _initRealm();

        return {
            current: function (val) {
                return _value('current', val);
            },
            origin: function (val) {
                return _value('origin', val);
            },
            init: _initRealm
        };

        function _initRealm(val) {
            if (!_realm) {
                _realm = {};
            }
            _value('origin', val);
            _value('current', val);
        }

        function _value(name, val) {
            var _valName = name + '_realm';
            if (typeof val !== 'undefined' && val !== _default) {
                if (val) {
                    $cookieStore.put(_valName, val);
                } else {
                    $cookieStore.remove(_valName);
                }
                _realm[name] = val || _default;
            } else {
                if (!_realm[name]) {
                    _realm[name] = $cookieStore.get(_valName) || _default;
                }
            }
            return _realm[name];
        }
    });
