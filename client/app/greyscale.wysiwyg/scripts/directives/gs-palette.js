/**
 * Created by igi on 10.05.16.
 */
angular.module('greyscale.wysiwyg')
    .directive('gsPalette', function ($log) {
        return {
            restrict: 'AEC',
            scope: {},
            template: '<div class="palette"><div class="palette-row" ng-repeat="row in model.palette">' +
                '<div class="palette-item" style="background-color:{{color}};" ng-repeat="color in row"></div></div></div>',
            controller: function ($scope) {
                $scope.model = {
                    palette: [
                        []
                    ],
                    rows: 8,
                    cols: 8
                };

                var r, subColor, _color,
                    rgb = ['00', '00', '00'],
                    colorQty = $scope.model.cols * $scope.model.rows;

                $scope.model.palette = [];

                for (_color = 0; _color < colorQty; _color++) {
                    $log.debug(_color);
                    if ((_color % $scope.model.cols) === 0) {
                        r = $scope.model.palette.length;
                        $scope.model.palette.push([]);
                    }

                    subColor = ((_color & 0x4) >> 2 | (_color & 0x20) >> 4);
                    rgb[0] = toHexByte(subColor << 6 | subColor << 4 | subColor << 2 | subColor);
                    subColor = ((_color & 0x2) >> 1 | (_color & 0x10) >> 3);
                    rgb[1] = toHexByte(subColor << 6 | subColor << 4 | subColor << 2 | subColor);
                    subColor = ((_color & 0x1) | (_color & 0x8) >> 2);
                    rgb[2] = toHexByte(subColor << 6 | subColor << 4 | subColor << 2 | subColor);

                    $scope.model.palette[r].push('#' + rgb.join(''));
                }
            }
        };

        function toHexByte(intVal) {
            var res = intVal.toString(16);
            if (res.length < 2) {
                res = '0' + res;
            }
            return res;
        }
    });
