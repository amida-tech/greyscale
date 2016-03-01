var sql = require('sql');

var columns = ['id', 'title', 'organizationId'];

var Group = sql.define({
    name: 'Groups',
    columns: columns
});

Group.whereCol = columns;

Group.editCols = ['title'];

Group.translate = ['title'];

module.exports = Group;
