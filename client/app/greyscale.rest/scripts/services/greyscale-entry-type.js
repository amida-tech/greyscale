/**
 * Created by igi on 15.12.15.
 */
'use strict';
angular.module('greyscale.rest')
.service('greyscaleEntryTypeSrv',function(greysaleRestSrv){

        return {
            list: function(){
                return greysaleRestSrv.one('essences')
            }
        };
    });
