var
  _ = require('underscore'),
  config = require('config'),
  Product = require('app/models/products'),
  Project = require('app/models/projects'),
  Workflow = require('app/models/workflows'),
  AccessMatrix = require('app/models/access_matrices'),
  ProductUOA = require('app/models/product_uoa'),
  UOA = require('app/models/uoas'),
  co = require('co'),
  Query = require('app/util').Query,
  getTranslateQuery = require('app/util').getTranslateQuery,
  query = new Query(),
  thunkify = require('thunkify'),
  HttpError = require('app/error').HttpError,
  thunkQuery = thunkify(query);

module.exports = {

  select: function (req, res, next) {
    co(function* (){
      //return yield thunkQuery(Product.select(Product.star(), Workflow.select().where(Workflow.id.equals(Product.workflowId))));
      return yield thunkQuery(Product.select());
    }).then(function(data){
      res.json(data);
    },function(err){
      next(err);
    })
  },

  selectOne: function (req, res, next) {
    var q = getTranslateQuery(req.lang.id, Product, Product.id.equals(req.params.id));
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      if(_.first(data)){
        res.json(_.first(data));
      }else{
        return next(new HttpError(404, 'Not found'));
      }
    });
  },

  delete: function (req, res, next) {
    var q = Product.delete().where(Product.id.equals(req.params.id));
    query(q, function (err, data) {
      if (err) {
        return next(err);
      }
      res.status(204).end();
    });
  },

  updateOne: function (req, res, next) {
    co(function* (){
      yield *checkProductData(req);
      return yield thunkQuery(Product.update(_.pick(req.body,Product.editCols)).where(Product.id.equals(req.params.id)));
    }).then(function(data){
      res.status(202).end();
    },function(err){
      next(err);
    });
  },

  insertOne: function (req, res, next) {
    co(function* () {
      yield *checkProductData(req);
      var result = yield thunkQuery(Product.insert(req.body).returning(Product.id));
      return result;
    }).then(function (data) {
      res.status(201).json(_.first(data));
    }, function (err) {
      next(err);
    });
  },

  UOAselect: function (req, res, next) {
    co(function* (){
      return yield thunkQuery(
          ProductUOA.select(UOA.star())
              .from(
                  ProductUOA
                      .leftJoin(UOA)
                      .on(ProductUOA.UOAid.equals(UOA.id))
              )
              .where(ProductUOA.productId.equals(req.params.id))
      );
    }).then(function(data){
      res.json(data);
    }, function(err){
      next(err);
    });
  },

  UOAadd: function (req, res, next) {
    query(ProductUOA.insert({productId : req.params.id, UOAid : req.params.uoaid}), function (err, data) {
      if (!err) {
        res.status(201).end();
      } else {
        next(err);
      }
    });
  },

  UOAaddMultiple: function (req, res, next) {
    co(function* (){
      if(!Array.isArray(req.body)){
        throw new HttpError(403, 'You should pass an array of unit ids in request body');
      }

      var product = yield thunkQuery(Product.select().where(Product.id.equals(req.params.id)));
      if(!_.first(product)){
        throw new HttpError(403, 'Product with id = ' + req.params.id + ' does not exist');
      }

      var result = yield thunkQuery(ProductUOA.select(ProductUOA.UOAid).from(ProductUOA).where(ProductUOA.productId.equals(req.params.id)));
      var exist_ids = result.map(function(value, key){
        return value.UOAid;
      });
      var result = yield thunkQuery(UOA.select(UOA.id).from(UOA).where(UOA.id.in(req.body)));
      var ids = result.map(function(value, key){
        return value.id;
      });
      var insertArr = [];
      for (var i in req.body) {
        if (ids.indexOf(req.body[i]) == -1) {
          throw new HttpError(403, 'Unit of Analisys with id = ' + req.body[i] + ' does not exist');
        }
        if (exist_ids.indexOf(req.body[i]) > -1){
          throw new HttpError(403, 'Relation for Unit of Analisys with id = ' + req.body[i] + ' has already existed');
        }
        insertArr.push({productId: req.params.id, UOAid: req.body[i]});
      }

      return yield thunkQuery(ProductUOA.insert(insertArr));
    }).then(function(data){
      res.json(data);
    }, function(err) {
      next(err);
    });


    //query(ProductUOA.insert({productId : req.params.id, UOAid : req.params.uoaid}), function (err, data) {
    //  if (!err) {
    //    res.status(201).end();
    //  } else {
    //    next(err);
    //  }
    //});
  },

  UOAdelete: function (req, res, next) {
    query(ProductUOA.delete().where({productId : req.params.id, UOAid : req.params.uoaid}), function (err, data) {
      if (!err) {
        res.status(204).end();
      } else {
        next(err);
      }
    });
  }

};

function* checkProductData (req){
  if(!req.params.id){ // create
    if(!req.body.matrixId || !req.body.projectId){
      throw new HttpError(403, 'Matrix id and Project id fields are required');
    }
  }


  if(req.body.matrixId){
    var isExistMatrix = yield thunkQuery(AccessMatrix.select().where(AccessMatrix.id.equals(req.body.matrixId)));
    if (!_.first(isExistMatrix)) {
      throw new HttpError(403, 'Matrix with this id does not exist');
    }
  }

  if(req.body.projectId){
    var isExistProject = yield thunkQuery(Project.select().where(Project.id.equals(req.body.projectId)));
    if (!_.first(isExistProject)) {
      throw new HttpError(403, 'Project with this id does not exist');
    }
  }

}
