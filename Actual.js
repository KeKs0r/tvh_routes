var helpers = require('./lib/helpers');
var Async = require('async');
var _ = require('lodash');
var getRoute = require('./lib/getRoute');


var getActual =  function (points, cb) {
    points = _.sortBy(points, 'sequence_no');
    var first = _.first(points);
    helpers.logPoint(first, 'Actual Starting');
    Async.times(points.length, function (i, next) {
        var startPoint = points[i];
        var endPoint = points[i + 1] ? points[i + 1] : startPoint; // in case there is only one point
        // the last point cannot be calculated to db
        if (i != points.length - 1 || points.length === 1) {
            getRoute(startPoint, endPoint, function (err, calculatedRouteData) {
                if (err) {
                    return cb(err);
                }
                var route = {
                    route: calculatedRouteData,
                    startPoint: startPoint,
                    endPoint: endPoint,
                    sequenceNumber: i + 1,
                    rideType: 'actual'
                };
                next(null, route);
            });
        } else {
            // This causes empty array elements in result
            next(null, null);
        }
    }, function (err, routes) {
        helpers.logPoint(first, 'Actual Finishing');
        if (err) {
            return cb(err);
        }
        // Remove the empty entries from
        var cleaned = _.filter(routes, function (r) {
            return r;
        });
        cb(null, cleaned);
    });
};

module.exports = getActual;