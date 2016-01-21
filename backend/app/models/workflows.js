var sql = require('sql');

var columns =  [
    'id',
    'name',
    'description',
    'created'
];

var Workflow = sql.define({
    name: 'Workflows',
    columns: columns
});

module.exports = Workflow;