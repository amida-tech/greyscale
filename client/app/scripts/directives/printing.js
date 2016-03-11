'use strict';

angular.module('greyscaleApp')
.directive('printArea', function(){
    return {
        restrict: 'A',
        link: function(scope, el, attr){
            var printable = $('#printable');
            if (!printable.length) {
                printable = $('<div id="printable"></div>');
                $('body').append(printable);
            }

            el.on('click', function(){
                var id = attr.printArea;
                var area = $('[printing-area="' + id + '"]');
                if (area.length) {
                    _printArea(area);
                }
            });

            function _printArea(area) {
                var mode = attr.printMode || '';
                var printing = $('<div><div class="' + mode + '">' + area.clone().html() + '</div></div>');
                printable.html(printing.html());
                window.print();
            }
        }
    };
});
