const sql = require('sql');
const _ = require("underscore");

const Task = sql.define({
    name: 'Tasks',
    columns: [
        'id',
        'title',
        'description',
        'uoaId',
        'stepId',
        'created',
        'productId',
        'startDate',
        'endDate',
        'userIds',
        'groupIds',
        'langId'
    ]
});

Task.editCols = [
    'title',
    'description',
    'startDate',
    'endDate',
    'userIds',
    'groupIds'
];

Task.translate = [
    'title',
    'description'
];

//TODO: Figure out how to dynamically determine schema when querying without relying on entire req object.

Task.all = function (schemaQuery) {
  return schemaQuery(this.select(this.star()).from(this));
};

Task.getById = function (schemaQuery, id) {
  return schemaQuery(this.select().where(this.id.equals(id)));
}

Task.destroy = function (schemaQuery, id) {
  return schemaQuery(this.delete().where(this.id.equals(id)));
}

Task.create = function (schemaQuery, task) {
  return schemaQuery(this.insert(_.pick(task, this.table._initialConfig.columns)).returning(this.id));
}



module.exports = Task;
