/**
 * Created by igi on 04.08.16.
 */
'use strict';
angular.module('greyscale.wysiwyg')
    .directive('gsOlTypes', function () {
            var olTypes = [{
                type: '1',
                title: '1,2,3...',
                active: true,
                hint: 'indicates numbers (default)'
            }, {
                type: 'a',
                title: 'a,b,c...',
                active: false,
                hint: 'indicates lowercase letters'
            }, {
                type: 'A',
                title: 'A,B,C...',
                hint: 'indicates uppercase letters'
            }, {
                type: 'i',
                title: 'i,ii,iii...',
                active: false,
                hint: 'indicates lowercase Roman numerals'
            }, {
                type: 'I',
                title: 'I,II,III...',
                active: false,
                hint: 'indicates uppercase Roman numerals'
            }];

            return {
/*                scope: {},*/
                restrict: 'E',
                transclude: true,
                templateUrl: 'greyscale.wysiwyg/views/gs-ol-types.html'
                /*
                controller: function ($scope) {
                    angular.extend($scope, {
                        view: olTypes,
                        model: olTypes[0]
                    });
                    $scope.select = _selectItem;

                    function _selectItem(idx) {
                        $scope.model = olTypes[idx];
                    }
                }
                */
            };
        }
    );
