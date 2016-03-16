var _ = require('lodash');
var Async = require('async');
var Moment = require('moment');

var db = require('./lib/db');
var dateFormat = 'YYYY-MM-DD';

var getActual = require('./Actual');
var getFirstSimulation = require('./Simul1');
var insertRoute = require('./lib/common').insertRoute;
var helpers = require('./lib/helpers');

Async.auto({
    getRoutes: function (cb) {
        var q = [
            'SELECT * FROM ',
            '   warehouse.rental_transport_points p',
            '   WHERE processed_date IS NULL',
            '   ORDER BY ride_date ASC',
            '   LIMIT 100 OFFSET 0',
            ';'

        ].join('\n');
        db.query(q, function (err, res) {
            if (err) {
                return cb(err)
            }
            var grouped = _.groupBy(res, function (ride) {
                var date = new Moment(ride.ride_date);
                return [ride.ride_no, ride.driver_emp_id, date.format(dateFormat)].join('_');
            });
            console.log('Amount of Routes:' + _.size(grouped) + ' / Points:' + res.length);
            cb(null, grouped);
        });
    },
    processRoutes:['getRoutes', function (cb, res) {
        Async.eachLimit(res.getRoutes, 1, function(points, nextRoute){
            Async.auto({
                getActual: function(finish){
                    getActual(points, finish)
                },
                getFirstSimulation: function(finish){
                    getFirstSimulation(points, finish)
                },
                insertRoute: ['getActual', 'getFirstSimulation', function(cb, res){
                    var allRoutes = res.getActual.concat(res.getFirstSimulation);
                    helpers.logRoutes(allRoutes);
                    insertRoute(allRoutes, cb);
                }]
            }, function(err,res){
                // Ingore single errors. Just continue
                nextRoute();
            });
        },function(err,res){
            cb(err,res)
        })
    }]
}, function (err, res) {
    if (err) {
        console.log('Something failed');
        console.error(err);
        process.exit(1);
    } else {
        console.log('Super Succesful');
        process.exit(0)
    }

});








