var sql = require('sql');

var columns = [
    'id',
    'section',
    'subsection',
    'number',
    'author'
];

var Policy = sql.define({
    name: 'Policies',
    columns: columns
});

Policy.whereCol = columns;

Policy.editCols = ['section', 'subsection', 'author', 'number'];

module.exports = Policy;
