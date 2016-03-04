var sql = require('sql');

var columns = ['id', 'tableName', 'name', 'fileName', 'nameField'];

var Essence = sql.define({
    name: 'Essences',
    schema: 'proto_amida',
    columns: columns
});

Essence.whereCol = columns;

module.exports = Essence;
