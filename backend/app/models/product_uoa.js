var sql = require('sql');

var ProductUOA = sql.define({
    name: 'ProductUOA',
    columns: ['productId', 'UOAid', 'currentStepId', 'isComplete', 'isDeleted']
});

module.exports = ProductUOA;
