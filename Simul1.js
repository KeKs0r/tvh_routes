var Async = require('async');
var Moment = require('moment');
var _ = require('lodash');

var logPoint = require('./helpers').logPoint;
var geolib = require('geolib');
var db = require('./lib/db');
var getRoute = require('./lib/getRoute');


var getFirstSimulation = function (points, cb) {
    points = _.sortBy(points, 'sequence_no');
    Async.mapSeries(points, function (point, nextPoint) {

        logPoint(point, 'Starting');
        Async.auto({
            getClosest: function (cb) {
                findClosestDepot(point, cb)
            },
            route: ['getClosest', function (cb, res) {
                var startPoint = point;
                var endPoint = res.getClosest;
                getRoute(startPoint, endPoint, function (err, calculatedRouteData) {
                    if (err) {
                        return cb(err);
                    }
                    var route = {
                        route: calculatedRouteData,
                        startPoint: startPoint,
                        endPoint: endPoint,
                        sequenceNumber: point.sequence_no * 2 - 1,
                        rideType: 'Simul 1'
                    };
                    cb(null, route);
                });
            }],
            reverse: ['route', function(cb, res){
                var towards = res.route;

                var startPoint = towards.endPoint;
                startPoint.ride_no = towards.startPoint.ride_no;
                startPoint.driver_emp_id = towards.startPoint.driver_emp_id;


                var reverse = {
                    route: towards.route,
                    startPoint: startPoint,
                    endPoint: towards.startPoint,
                    sequenceNumber: towards.sequenceNumber + 1,
                    rideType: 'Simul 1'
                };
                cb(null, reverse);
            }]
        }, function (err, res) {
            logPoint(point, 'Finishing');
            if(err){
                return nextPoint(err);
            }
            nextPoint(null, [res.route, res.reverse]);
        });

    }, function (err, routes) {
        if (err) {
            return cb(err);
        }
        cb(null, _.flatten(routes));
    });
};


var findClosestDepot = function (point, cb) {
    Async.auto({
        getDepots: findAllDepots,
        mapDistance: ['getDepots', function (cb, res) {
            var depots = res.getDepots;
            var withDistance = _.map(depots, function (depot) {
                depot.distance = geolib.getDistance(point, depot);
                return depot;
            });
            cb(null, withDistance);
        }]
    }, function (err, res) {
        if (err) {
            return cb(err);
        }
        var depots = res.mapDistance;
        var closest = _.first(_.sortBy(depots, 'distance'));
        cb(null, closest);
    });
};





var rental_depots = [];
var findAllDepots = function (cb) {
    if(rental_depots.length > 0){
        Async.setImmediate(function(){
            cb(null,rental_depots)
        });
    }
    db.query('SELECT * from warehouse.rental_depots', function(err,res){
        if(err){
            return cb(err);
        }
        rental_depots = res;
        cb(null, rental_depots);
    });
};


module.exports = getFirstSimulation;