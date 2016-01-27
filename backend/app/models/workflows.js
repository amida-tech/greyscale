var sql = require('sql');

var columns = [
    'id',
    'name',
    'description',
    'created',
    'ownerId',
    'totalDuration'
];

var Workflow = sql.define({
    name: 'Workflows',
    schema: 'proto_amida',
    columns: columns
});

module.exports = Workflow;
