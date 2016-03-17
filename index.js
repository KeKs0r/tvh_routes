var _ = require('lodash');
var Async = require('async');
var Moment = require('moment');

var db = require('./lib/db');
var dateFormat = 'YYYY-MM-DD';

var getActual = require('./Actual');
var getFirstSimulation = require('./Simul1');
var getSecondSimulation = require('./Simul2');
var getThirdSimulation = require('./Simul3');
var insertRoute = require('./lib/common').insertRoute;
var updatePoint = require('./lib/common').updatePoint;
var helpers = require('./lib/helpers');
var getCoordinates = require('./lib/getCoordinates');

var parallelCount = (helpers.production) ? 20 : 1;

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
    processRoutes: ['getRoutes', function (cb, res) {
        Async.eachLimit(res.getRoutes, parallelCount, function (points, nextRoute) {
            Async.auto({
                points: function (finish) {
                    Async.map(points, function (point, next) {
                        if (_.isEmpty(point.longitude) || _.isEmpty(point.latitude)) {
                            getCoordinates(point, function (err, coords) {
                                if(err){
                                    next(err);
                                }
                                point.longitude = coords.longitude;
                                point.latitude = coords.latitude;
                                point.dirty = true;
                                next(null, point)
                            });
                        } else {
                            next(null, point);
                        }
                    },finish);
                },
                updatePoints: ['points', function (cb, res) {
                    var points = res.points;
                    var dirtyPoints = _.filter(points, 'dirty');
                    Async.each(dirtyPoints, updatePoint, cb);
                }],
                getActual: ['points', function (finish, res) {
                    var points = res.points;
                    getActual(points, finish)
                }],
                getFirstSimulation: ['points', function (finish, res) {
                    var points = res.points;
                    getFirstSimulation(points, finish)
                }],
                getSecondSimulation: ['points', function (finish, res) {
                    var points = res.points;
                    getSecondSimulation(points, finish)
                }],
                getThirdSimulation: ['points', function (finish, res) {
                    var points = res.points;
                    getThirdSimulation(points, finish)
                }],
                insertRoute: ['getActual', 'getFirstSimulation', 'getSecondSimulation', 'getThirdSimulation', function (cb, res) {
                    var allRoutes = res.getActual
                        .concat(res.getFirstSimulation)
                        .concat(res.getSecondSimulation)
                        .concat(res.getThirdSimulation);
                    helpers.logRoutes(allRoutes);
                    insertRoute(allRoutes, cb);
                }]
            }, function (err, res) {
                // Ingore single errors. Just continue
                if(err){
                    console.error(err);
                }
                nextRoute();
            });
        }, function (err, res) {
            cb(err, res)
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








