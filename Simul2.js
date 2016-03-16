var Async = require('async');
var _ = require('lodash');

var logPoint = require('./lib/helpers').logPoint;
var db = require('./lib/db');
var getRoute = require('./lib/getRoute');
var findAllDepots = require('./lib/common').findAllDepots;
var reverseRoute = require('./lib/common').reverseRoute;


var getFirstSimulation = function (points, cb) {
    points = _.sortBy(points, 'sequence_no');
    Async.mapSeries(points, function (point, nextPoint) {

        logPoint(point, 'Simul 2 Starting');
        Async.auto({
            getDefault: function (cb) {
                findDefaultDepot(point, cb)
            },
            route: ['getDefault', function (cb, res) {
                var startPoint = point;
                var endPoint = res.getDefault;
                getRoute(startPoint, endPoint, function (err, calculatedRouteData) {
                    if (err) {
                        return cb(err);
                    }
                    var route = {
                        route: calculatedRouteData,
                        startPoint: startPoint,
                        endPoint: endPoint,
                        sequenceNumber: point.sequence_no * 2 - 1,
                        rideType: 'Simul 2'
                    };
                    cb(null, route);
                });
            }],
            reverse: reverseRoute
        }, function (err, res) {
            logPoint(point, 'Simul 2 Finishing');
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


var defaultDepots = [];
var loadDefaultDepots = function (cb) {
    if (defaultDepots.length > 0) {
        cb(null, defaultDepots);
    }
    var q = [
        'SELECT',
        '   driver_emp_id, default_depot_id',
        '   FROM warehouse.rental_transport_units'
    ].join('\n');
    db.query(q, function (err, res) {
        if (err) {
            return cb(err);
        }
        defaultDepots = res;
        cb(null, res);
    })
};


var findDefaultDepot = function (point, cb) {
    Async.auto({
        getDepots: findAllDepots,
        loadDefaultDepots: loadDefaultDepots
    }, function (err, res) {
        if (err) {
            return cb(err);
        }
        var depot;
        var def = _.find(res.loadDefaultDepots, {driver_emp_id: point.driver_emp_id});
        if (def) {
            depot = _.find(res.getDepots, {depot_id: def.default_depot_id});
        }
        if(!depot){
            if(def && def.default_depot_id){
                console.warn('Could not find depot, although driver had a default_depot:'+def.default_depot_id);
            }
            depot = _.find(res.getDepots, {depot_id: "5"});
        }
        cb(null, depot);
    });
};


module.exports = getFirstSimulation;