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

                var r, c, row, _color, rgb;

                $scope.model.palette =[];

                for (r = 0; r < $scope.model.rows; r++) {
                    $scope.model.palette.push([]);
                    for (c = 0; c < $scope.model.cols; c++) {
                        _color = c+ r*$scope.model.cols;
                        rgb = [
                            ((_color & 0x30) << 2).toString(16),
                            ((_color & 0xC) << 4).toString(16),
                            ((_color & 0x3) << 6).toString(16)
                        ];
                        $log.debug(_color.toString(16), rgb);
                        $scope.model.palette[r].push('#'+rgb.join(''));
                    }
                }
            }
        };
    });
