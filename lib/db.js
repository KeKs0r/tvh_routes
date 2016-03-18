'use strict';
var logger = require('./logger');

// var conString = "postgres://roelvaneyghen@localhost:5432/TVH_BI_Warehouse";
// var conString = "postgres://roelv:RoelV@devdwh.tvh.local:5432/TVH_BI_Warehouse";
// Database connection parameters:
var config = {
    host: 'localhost',
    port: 5432,
    database: 'tvh_route',
    user: 'postgres'
};


var Pg = require('pg');

var query = function (sql, cb) {
    Pg.connect(config, function (err, client, release) {

        if (err) {
            logger.error('Connection to the database failed');
            release();
            cb(err);
        } else {
            client.query(sql, function (err, result) {
                if (err) {
                    // Query had an error. Kill this client to make sure we get no consecutive fails
                    logger.warn('Query Failed:');
                    logger.warn(sql);
                    release(true);
                    cb(err);
                } else {
                    // Query completed successfully :)
                    release();
                    cb(null, result.rows);
                }
            });
        }
    });
};

module.exports = {
  query: query
};
