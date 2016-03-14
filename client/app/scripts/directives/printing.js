'use strict';

angular.module('greyscaleApp')
    .directive('printArea', function ($timeout) {
        return {
            restrict: 'A',
            scope: {
                preprocess: '=printPreprocess'
            },
            link: function (scope, el, attr) {
                var printable = $('#printable');
                if (!printable.length) {
                    printable = $('<div id="printable"></div>');
                    $('body').append(printable);
                }

                el.on('click', function () {
                    var id = attr.printArea;
                    var area = $('[printing-area="' + id + '"]');
                    if (area.length) {
                        _printArea(area.clone());
                    }
                });

                var inputSelector = 'input, textarea, select';

                function _printArea(area) {
                    var mode = attr.printCssMode || '';
                    area.find(inputSelector).each(function () {
                        this.id = this.id || Math.round(Math.random() * 1e12);
                    });
                    var printing = $('<div><div class="' + mode + '">' + area.html() + '</div></div>');
                    printable.html(printing.html());
                    printable.find('a[href]').attr('href', '#');
                    if (typeof scope.preprocess === 'function') {
                        scope.preprocess(printable);
                    }
                    $timeout(function () {
                        window.print();
                        $timeout(function () {
                            if (attr.printClose !== undefined) {
                                scope.$eval(attr.printClose);
                            }
                            printable.html('');
                        });
                    });
                }
            }
        };
    });
