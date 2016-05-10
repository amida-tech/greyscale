/**
 * Created by igi on 10.05.16.
 */
angular.module('greyscale.wysiwyg')
    .directive('gsPalette', function ($log) {
        return {
            restrict: 'AEC',
            scope: {},
            template: '<table><tr ng-repeat="row in model.palette"><td ng-repeat="color in row"><i class="fa fa-square" style="color:{{color}};"></i></td></tr></table>',
            controller: function ($scope) {
                $scope.model = {
                    palette: [[]],
                    rows: 8,
                    cols: 8
                };

                var r, c, subColor, _color, rgb;

                $scope.model.palette = [];

                for (r = 0; r < $scope.model.rows; r++) {
                    $scope.model.palette.push([]);
                    for (c = 0; c < $scope.model.cols; c++) {
                        _color = c + r * $scope.model.cols;

                        rgb = [];
                        subColor = (_color & 0x30);
                        rgb.push(toHexByte(subColor << 2 | subColor | subColor >> 2 | subColor >> 4));
                        subColor = (_color & 0xC);
                        rgb.push(toHexByte(subColor << 4 | subColor << 2 | subColor | subColor >> 2));
                        subColor = (_color & 0x3);
                        rgb.push(toHexByte(subColor << 6 | subColor << 4 | subColor << 2 | subColor));

                        $log.debug(_color.toString(16,2), rgb);
                        $scope.model.palette[r].push('#' + rgb.join(''));
                    }
                }
            }
        };

        function toHexByte(intVal) {
            var res = intVal.toString(16);
            if (res.length < 2) {
                res = '0'+res;
            }
            return res;
        }
    });
