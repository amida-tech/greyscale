var sql = require('sql');

var ProductUOA = sql.define({
    name: 'ProductUOA',
    schema: 'proto_amida',
    columns: ['productId', 'UOAid', 'currentStepId']
});

module.exports = ProductUOA;
