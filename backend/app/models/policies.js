var sql = require('sql');

var columns = [
    'id',
    'section',
    'subsection',
    'number',
    'author',
    'editor'
];

var Policy = sql.define({
    name: 'Policies',
    columns: columns
});

Policy.whereCol = columns;

Policy.editCols = ['section', 'subsection', 'number'];

module.exports = Policy;
