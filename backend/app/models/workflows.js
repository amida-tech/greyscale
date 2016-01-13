var sql = require('sql');

var columns =  [
    'id',
    'name',
    'description',
    'created',
    'ownerId',
    'totalDuration'
];

var Workflow = sql.define({
    name: 'Workflows',
    columns: columns
});


module.exports = Workflow;