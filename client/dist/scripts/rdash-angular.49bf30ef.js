!function(){"use strict";angular.module("RDash",["ui.bootstrap","ui.router","ngCookies"])}(),function(){"use strict";function a(){return{restrict:"AE",template:'<div class="loading"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>'}}angular.module("RDash").directive("rdLoading",a)}(),function(){"use strict";function a(){return{transclude:!0,template:'<div class="widget" ng-transclude></div>',restrict:"EA"}}angular.module("RDash").directive("rdWidget",a)}(),function(){"use strict";function a(){return{requires:"^rdWidget",scope:{loading:"=?",classes:"@?"},transclude:!0,template:'<div class="widget-body" ng-class="classes"><rd-loading ng-show="loading"></rd-loading><div ng-hide="loading" class="widget-content" ng-transclude></div></div>',restrict:"E"}}angular.module("RDash").directive("rdWidgetBody",a)}(),function(){"use strict";function a(){return{requires:"^rdWidget",transclude:!0,template:'<div class="widget-footer" ng-transclude></div>',restrict:"E"}}angular.module("RDash").directive("rdWidgetFooter",a)}(),function(){"use strict";function a(){var a={requires:"^rdWidget",scope:{title:"@",icon:"@"},transclude:!0,template:'<div class="widget-header"><div class="row"><div class="col-xs-6 col-sm-8"><i class="fa" ng-class="icon"></i> {{title}} </div><div class="pull-right col-xs-6 col-sm-4" ng-transclude></div></div></div>',restrict:"E"};return a}angular.module("RDash").directive("rdWidgetHeader",a)}();