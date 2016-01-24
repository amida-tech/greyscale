var sql = require('sql');

var ProductUOA = sql.define({
    name: 'ProductUOA',
    columns: ['productId', 'UOAid']
});

module.exports = ProductUOA;
