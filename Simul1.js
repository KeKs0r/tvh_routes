var Async = require('async');
var Moment = require('moment');
var _ = require('lodash');

var logPoint = require('./lib/helpers').logPoint;
var geolib = require('geolib');
var getRoute = require('./lib/getRoute');
var findAllDepots = require('./lib/common').findAllDepots;
var reverseRoute = require('./lib/common').reverseRoute;
var helpers = require('./lib/helpers');


var getFirstSimulation = function (points, cb) {
    points = _.sortBy(points, 'sequence_no');
    Async.mapSeries(points, function (point, nextPoint) {

        logPoint(point, 'Simul 1 Starting');
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
            reverse: reverseRoute
        }, function (err, res) {
            logPoint(point, 'Simul 1 Finishing');
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






module.exports = getFirstSimulation;