'use strict';
angular.module('greyscale.core')
.filter('highlight', function ($sce) {
    var hlClass = 'bg-warning',
        hlTag = 'b';

    var classAttr = hlClass ? ' class="' + hlClass + '"' : '',
        prefix = '<' + hlTag + classAttr + '>',
        postfx = '</' + hlTag + '>';

    return function(text, search) {
        if (search) {
            text = text.replace(new RegExp('('+search+')', 'gi'), prefix + '$1' + postfx);
        }
        return $sce.trustAsHtml(text)
    };
});
