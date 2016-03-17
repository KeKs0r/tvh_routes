var Async = require('async');
var _ = require('lodash');

var logPoint = require('./lib/helpers').logPoint;
var getRoute = require('./lib/getRoute');
var reverseRoute = require('./lib/common').reverseRoute;


var getSecondSimulation = function (points, cb) {
    points = _.sortBy(points, 'sequence_no');

    var start = _.first(points);
    var restPoints = _.slice(points, 1);
    Async.mapSeries(restPoints, function (point, nextPoint) {

        logPoint(point, 'Simul 3 Starting');
        Async.auto({
            route: function (cb) {
                var startPoint = start;
                var endPoint = point;
                getRoute(startPoint, endPoint, function (err, calculatedRouteData) {
                    if (err) {
                        return cb(err);
                    }
                    var route = {
                        route: calculatedRouteData,
                        startPoint: startPoint,
                        endPoint: endPoint,
                        sequenceNumber: (point.sequence_no - 1) * 2 - 1,
                        rideType: 'Simul 3'
                    };
                    cb(null, route);
                });
            },
            reverse: reverseRoute
        }, function (err, res) {
            logPoint(point, 'Simul 3 Finishing');
            if (err) {
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


module.exports = getSecondSimulation;