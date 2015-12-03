/**
 * Created by igi on 03.12.15.
 */
'use strict';

angular.module('greyscale.core')
.factory('greyscaleAccessSrv',function($log,greyscaleRestSrv){
        var _listRoles = function(){
            return greyscaleRestSrv().one('roles').get();
        };

        return {
            roles: _listRoles
        };
    });
