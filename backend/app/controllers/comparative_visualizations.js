var _ = require('underscore'),
    ComparativeVisualization = require('app/models/comparative_visualizations'),
    ComparativeVisualizationProduct = require('app/models/comparative_visualization_products'),
    UnitOfAnalysis = require('app/models/uoas'),
    ImportedDataset = require('app/models/imported_datasets'),
    HttpError = require('app/error').HttpError,
    Query = require('app/util').Query,
    query = new Query(),
    co = require('co'),
    thunkify = require('thunkify'),
    thunkQuery = thunkify(query);

module.exports = {
    select: function (req, res, next) {
        co(function* () {
            var results = yield thunkQuery(
                ComparativeVisualization
                .select(
                    ComparativeVisualization.id,
                    ComparativeVisualization.title,
                    "format('[%s]', " +
                        "string_agg(format('{ \"productId\": %s, \"indexId\": %s }', " + 
                            '"ComparativeVisualizationProducts"."productId", ' +
                            '"ComparativeVisualizationProducts"."indexId" ' +
                        "), ',')" +
                    ') AS products ',
                    '"ComparativeVisualizations"."uoaIds" AS "targetIds"'
                )
                .where(
                    ComparativeVisualization.organizationId.equals(req.params.organizationId)
                )
                .from(
                    ComparativeVisualization
                    .leftJoin(ComparativeVisualizationProduct)
                    .on(ComparativeVisualization.id.equals(ComparativeVisualizationProduct.visualizationId))
                )
                .group(
                    ComparativeVisualization.id
                )
            );
            return results.map(function (viz) {
                viz.products = parseProductsString(viz.products);
                return viz;
            });
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertOne: function (req, res, next) {
        co(function* () {
            if (req.user.roleID != 1 && (req.user.organizationId != req.params.organizationId)) {
                throw new HttpError(400, 'You cannot save visualizations to other organizations');
            }

            // insert ComparativeVisualization
            var viz = {
                title: req.body.title,
                organizationId: req.params.organizationId,
                uoaIds: req.body.targetIds
            };
            var result = yield thunkQuery(ComparativeVisualization.insert(viz).returning(ComparativeVisualization.id));
            console.log("VIZID", result[0].id);

            // insert ComparativeVisualizationProducts
            var products = req.body.products || [];
            for (var i = 0; i < products.length; i++) {
                yield thunkQuery(ComparativeVisualizationProduct.insert({
                    visualizationId: result[0].id,
                    productId: products[i].productId,
                    indexId: products[i].indexId
                }));
            }

            return result;
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    updateOne: function (req, res, next) {
        co(function* () {
            if (req.user.roleID != 1 && (req.user.organizationId != req.params.organizationId)) {
                throw new HttpError(400, 'You cannot save visualizations to other organizations');
            }

            // check viz and organization id
            var viz = yield thunkQuery(ComparativeVisualization.select(ComparativeVisualization.organizationId).where(
                ComparativeVisualization.id.equals(req.params.id).and(ComparativeVisualization.organizationId.equals(req.params.organizationId))
            ));
            if (!viz) {
                throw new HttpError(400, 'You cannot save visualizations to other organizations');
            }

            // update ComparativeVisualization
            yield thunkQuery(ComparativeVisualization.update({
                title: req.body.title,
                uoaIds: req.body.targetIds
            }).where(
                ComparativeVisualization.id.equals(req.params.id)
            ));

            // drop existing ComparativeVisualizationProducts
            yield thunkQuery(ComparativeVisualizationProduct.delete().where(
                ComparativeVisualizationProduct.visualizationId.equals(req.params.id)
            ));

            // insert new ones
            var products = req.body.products || [];
            for (var i = 0; i < products.length; i++) {
                yield thunkQuery(ComparativeVisualizationProduct.insert({
                    visualizationId: req.params.id,
                    productId: products[i].productId,
                    indexId: products[i].indexId
                }));
            }
        }).then(function () {
            res.status(202).end();
        }, function (err) {
            next(err);
        });
    },

    deleteOne: function (req, res, next) {
        co(function* () {
            return yield thunkQuery(
                ComparativeVisualization.delete().where(
                    ComparativeVisualization.id.equals(req.params.id).and(ComparativeVisualization.organizationId.equals(req.params.organizationId))
                )
            );
        }).then(function (data) {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    selectOne: function (req, res, next) {
        co(function* () {
            var result = yield thunkQuery(
                ComparativeVisualization
                .select(
                    ComparativeVisualization.id,
                    ComparativeVisualization.title,
                    "format('[%s]', " +
                        "string_agg(format('{ \"productId\": %s, \"indexId\": %s }', " + 
                            '"ComparativeVisualizationProducts"."productId", ' +
                            '"ComparativeVisualizationProducts"."indexId" ' +
                        "), ',')" +
                    ') AS products',
                    '"ComparativeVisualizations"."uoaIds" AS "targetIds"'
                )
                .where(
                    ComparativeVisualization.id.equals(req.params.id)
                    .and(ComparativeVisualization.organizationId.equals(req.params.organizationId))
                )
                .from(
                    ComparativeVisualization
                    .leftJoin(ComparativeVisualizationProduct)
                    .on(ComparativeVisualization.id.equals(ComparativeVisualizationProduct.visualizationId))
                )
                .group(
                    ComparativeVisualization.id
                )
            );
            if (!result[0]) {
                throw new HttpError(404, 'Not found');
            }
            result[0].products = parseProductsString(result[0].products);
            return result[0];
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },


    parseDataset: function (req, res, next) {
        var csv = require('csv');
        var fs = require('fs');

        var upload = function*(){
            return yield new Promise(function(resolve, reject) {
                if(req.files.file) {
                    console.log(req.files.file);
                    fs.readFile(req.files.file.path, 'utf8', function (err, data) {
                        if (err) {
                            reject(new HttpError(403, 'Cannot open uploaded file'));
                        }
                        resolve(data);
                    });
                }else{
                    reject( new HttpError(403,'Please, pass csv file in files[\'file\']'));
                }
            });
        };

        var parser = function* (data) {
            return yield new Promise(function(resolve, reject){
                csv.parse(data, function (err, data) {
                    if (err) {
                        reject(new HttpError(403, 'Cannot parse data from file'));
                    }
                    resolve(data);
                });
            });
        };

        co(function* () {
            try {
                var doUpload = yield* upload();
                var parsed = yield* parser(doUpload);

                var cols = parsed.shift().map(function (title, i) {
                    return {
                        title: title,
                        id: i
                    };
                });

                return {
                    cols: cols,
                    data: parsed
                };
            } catch (e) {
                throw e;
            }
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    insertDataset: function (req, res, next) {
        co(function* () {
            if (
                typeof req.body.cols === 'undefined' ||
                typeof req.body.uoaCol === 'undefined' ||
                typeof req.body.uoaType === 'undefined' ||
                typeof req.body.dataCol === 'undefined' ||
                typeof req.body.data === 'undefined'
            ) {
                throw new HttpError(403, 'cols, uoaCol, uoaType, dataCol and data fields are required');
            }

            var dataset = _.pick(req.body, ['title', 'cols', 'uoaCol', 'uoaType', 'yearCol', 'dataCol', 'data']);
            dataset.visualizationId = req.params.id;

            return yield thunkQuery(ImportedDataset.insert(dataset).returning(ImportedDataset.id));
        }).then(function (data) {
            res.status(201).json(_.first(data));
        }, function (err) {
            next(err);
        });
    },

    selectDataset: function (req, res, next) {
        co(function* () {
            // check viz and organization id
            var viz = yield thunkQuery(ComparativeVisualization.select(ComparativeVisualization.organizationId).where(
                ComparativeVisualization.id.equals(req.params.id).and(ComparativeVisualization.organizationId.equals(req.params.organizationId))
            ));
            if (!viz) {
                throw new HttpError(400, 'No such visualization');
            }

            var dataset = yield thunkQuery(
                ImportedDataset.select(
                    ImportedDataset.star()
                )
                .where(
                    ImportedDataset.visualizationId.equals(req.params.id)
                    .and(ImportedDataset.id.equals(req.params.datasetId))
                )
            );
            if (!dataset) {
                throw new HttpError(400, 'No such dataset');
            }
            dataset = dataset[0];

            // group by year
            var products = [];
            if (dataset.yearCol) {
                var groups = _.groupBy(dataset.data, function (row) {
                    return row[dataset.yearCol];
                });
                for (var year in groups) {
                    products.push({
                        title: dataset.title + ' ' + year,
                        data: groups[year]
                    });
                }
            } else {
                products = [{
                    title: dataset.title,
                    data: dataset.data
                }];
            }

            // match to UOAs
            // TODO: don't do this on every request
            // can we do with sql joins while still preserving variable-column data storage?
            if (dataset.uoaType !== 'ISO' && dataset.uoaType !== 'ISO2') {
                dataset.uoaType = 'name';
            }
            var uoasMapping = {};
            var uoas = yield thunkQuery(
                UnitOfAnalysis.select(
                    UnitOfAnalysis.id,
                    UnitOfAnalysis[dataset.uoaType],
                    UnitOfAnalysis.name
                )
            );
            uoas.forEach(function (uoa) {
                var slug = uoa[dataset.uoaType];
                if (typeof slug !== 'undefined' && slug !== null && slug !== '') {
                    uoasMapping[uoa[dataset.uoaType]] = uoa;
                }
            });

            products = products.map(function (product) {
                var data = [];
                product.data.forEach(function (row) {
                    var uoa = uoasMapping[row[dataset.uoaCol]];
                    if (uoa) {
                        data.push({
                            id: uoa.id,
                            name: uoa.name,
                            // TODO: parseFloat best option?
                            val: parseFloat(row[dataset.dataCol])
                        });
                    }
                });
                product.data = data;
                return product;
            });

            return products;
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    selectDatasets: function (req, res, next) {
        co(function* () {
            // check viz and organization id
            var viz = yield thunkQuery(ComparativeVisualization.select(ComparativeVisualization.organizationId).where(
                ComparativeVisualization.id.equals(req.params.id).and(ComparativeVisualization.organizationId.equals(req.params.organizationId))
            ));
            if (!viz) {
                throw new HttpError(400, 'No such visualization');
            }

            var datasets = yield thunkQuery(
                ImportedDataset.select(
                    ImportedDataset.id,
                    ImportedDataset.title,
                    ImportedDataset.cols,
                    ImportedDataset.uoaCol,
                    ImportedDataset.uoaType,
                    ImportedDataset.yearCol,
                    ImportedDataset.dataCol
                )
                .where(
                    ImportedDataset.visualizationId.equals(req.params.id)
                )
            );
            return datasets.map(function (dataset) {
                dataset.cols = dataset.cols.map(function (title, i) {
                    return {
                        title: title,
                        id: i
                    };
                });
                return dataset;
            });
        }).then(function (data) {
            res.json(data);
        }, function (err) {
            next(err);
        });
    },

    deleteDataset: function (req, res, next) {
        co(function* () {
            // check viz and organization id
            var viz = yield thunkQuery(ComparativeVisualization.select(ComparativeVisualization.organizationId).where(
                ComparativeVisualization.id.equals(req.params.id).and(ComparativeVisualization.organizationId.equals(req.params.organizationId))
            ));
            if (!viz) {
                throw new HttpError(400, 'No such visualization');
            }

            return yield thunkQuery(
                ImportedDataset.delete().where(
                    ImportedDataset.id.equals(req.params.datasetId).and(ImportedDataset.visualizationId.equals(req.params.id))
                )
            );
        }).then(function (data) {
            res.status(204).end();
        }, function (err) {
            next(err);
        });
    },

    updateDataset: function (req, res, next) {
        // TODO
        co(function* () {
            // check viz and organization id
            var viz = yield thunkQuery(ComparativeVisualization.select(ComparativeVisualization.organizationId).where(
                ComparativeVisualization.id.equals(req.params.id).and(ComparativeVisualization.organizationId.equals(req.params.organizationId))
            ));
            if (!viz) {
                throw new HttpError(400, 'No such visualization');
            }

            // only non-data cols updateable
            if (
                typeof req.body.uoaCol === 'undefined' ||
                typeof req.body.uoaType === 'undefined' ||
                typeof req.body.dataCol === 'undefined'
            ) {
                throw new HttpError(403, 'uoaCol, uoaType and dataCol fields are required');
            }

            var dataset = _.pick(req.body, ['title', 'uoaCol', 'uoaType', 'yearCol', 'dataCol']);
            return yield thunkQuery(ImportedDataset.update(dataset).where(
                ImportedDataset.id.equals(req.params.datasetId).and(ImportedDataset.visualizationId.equals(req.params.id))
            ));
        }).then(function (data) {
            res.status(202).json(_.first(data));
        }, function (err) {
            next(err);
        });
    }

};

function parseProductsString(productsString) {
    // parse JSON products string into js object
    // due to postgres quirks, [] represented as '[,]'
    try {
        return JSON.parse(productsString);
    } catch (e) {
        return []
    }
}

