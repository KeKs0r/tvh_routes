var Soap = require('soap');
var _ = require('lodash');
var geolib = require('geolib');
var Async = require('async');
var Moment = require('moment');

var db = require('./lib/db');


var dateFormat = 'YYYY-MM-DD';


Async.auto({
    getRoutes: function (cb) {
        var q = [
            'SELECT * FROM ',
            '   warehouse.rental_transport_points p',
            '   WHERE NOT EXISTS (',
            '       SELECT 1 from',
            '           warehouse.rental_transport_routes r',
            '       WHERE',
            '           p.ride_date = r.ride_date AND',
            '           p.driver_emp_id = r.driver_emp_id AND',
            '           p.ride_no = r.ride_no',
            '    )',
            'ORDER BY ride_date ASC;'

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
    //insertActual: ['getRoutes', function (cb, res) {
    //    var routes = res.getRoutes;
    //    Async.eachLimit(routes, 10, insertActual, cb);
    //}],
    insertFirstSimulation: ['getRoutes', function (cb, res) {
        var routes = res.getRoutes;
        Async.eachLimit(routes, 10, insertFirstSimulation, cb);
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


var insertActual = function (points, cb) {
    points = _.sortBy(points, 'sequence_no');
    var first = _.first(points);
    var id = Moment(first.ride_date).format(dateFormat) + ' D:' + first.driver_emp_id + ' R' + first.ride_no;
    //console.log(id + '  --> '+points.length);
    Async.times(points.length, function (i, next) {
        //console.log(id + '#'+i);
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
        if (err) {
            return cb(err);
        }
        // Remove the empty entries from
        var cleaned = _.filter(routes, function (r) {
            return r;
        });
        insertRouteDB(cleaned, cb);
    });
};

var insertFirstSimulation = function (points, cb) {
    points = _.sortBy(points, 'sequence_no');
    Async.each(points, function (point, next) {
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
                        sequenceNumber: i + 1,
                        rideType: 'Simul 1'
                    };
                    cb(null, route);
                });
            }]
        }, function (err, res) {
            next(err, res.route);
        });
    }, function (err, routes) {
        if (err) {
            return cb(err);
        }
        // Remove the empty entries from
        var cleaned = _.filter(routes, function (r) {
            return r;
        });
        insertRouteDB(cleaned, cb);
    });
};

var insertRouteDB = function (routes, cb) {
    var q = [
        'INSERT INTO warehouse.rental_transport_routes',
        '   (ride_no, sequence_no, driver_emp_id, ride_date, from_latitude, from_longitude, to_latitude, to_longitude, ride_type, distance, route_time)',
        '   VALUES '
    ];
    var inserts = [];
    routes.forEach(function (r) {
        var single = '(' + [
                r.startPoint.ride_no,
                r.sequenceNumber,
                r.startPoint.driver_emp_id,
                "date '" + Moment(r.startPoint.ride_date).format(dateFormat) + "'",
                r.startPoint.latitude,
                r.startPoint.longitude,
                r.endPoint.latitude,
                r.endPoint.longitude,
                '\'' + r.rideType + '\'',
                r.route.totalDistance,
                r.route.totalTime
            ].join(',') + ' ) ';
        inserts.push(single)
    });
    q.push(inserts.join(','));
    q.push(';');
    db.query(q.join('\n'), cb);
};

var findClosestDepot = function (point, cb) {
    Async.auto({
        getDepots: findAllDepots,
        mapDistance: ['findAllDepots', function (cb, res) {
            var depots = res.getDepots;
            var withDistance = _.map(depots, function (depot) {
                depot.distance = geolib.getDistance(point, depot);
                return depot;
            });
            cb(null, withDistance)
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

var findAllDepots = Async.memoize(function (cb) {
    DB.query('SELECT * from warehous.rental_depots', cb);
});


var getRoute = function (startPoint, endPoint, callback) {
    // @TODO check geo arguments
    var calculatedRouteData = {
        totalDistance: 0,
        totalTime: 0
    };
    // Only send a request when geocoordinates aren't identical
    if (startPoint.latitude == endPoint.latitude && startPoint.longitude == endPoint.longitude) {
        if (callback) callback(null, calculatedRouteData);
    } else {
        var url = 'http://be-plw-tst-0009:8480/anymap/services/Router?wsdl';
        var args = {
            startPoint: {
                'attributes': {
                    'xsi:type': 'bean:LonLatPoint',
                    'xmlns:bean': 'http://beans.soap.geosolutions.be'
                },
                'lat': {
                    'attributes': {
                        'xsi:type': 'xsd:double'
                    },
                    $value: startPoint.latitude
                },
                'lon': {
                    'attributes': {
                        'xsi:type': 'xsd:double'
                    },
                    $value: startPoint.longitude
                }
            },
            endPoint: {
                'attributes': {
                    'xsi:type': 'bean:LonLatPoint',
                    'xmlns:bean': 'http://beans.soap.geosolutions.be'
                },
                'lat': {
                    'attributes': {
                        'xsi:type': 'xsd:double'
                    },
                    $value: endPoint.latitude
                },
                'lon': {
                    'attributes': {
                        'xsi:type': 'xsd:double'
                    },
                    $value: endPoint.longitude
                }
            },
            transportMode: {
                'attributes': {
                    'xsi:type': 'xsd:byte'
                },
                $value: 1
            },
            criteria: {
                'attributes': {
                    'xsi:type': 'xsd:byte'
                },
                $value: 0
            },
            returnRoute: {
                'attributes': {
                    'xsi:type': 'xsd:boolean'
                },
                $value: true
            },
            language: {
                'attributes': {
                    'xsi:type': 'xsd:string'
                },
                $value: true
            }
        };

        // NO SOAP API ACCESS (LOCAL NETWORK)
        // soap.createClient(url, function(err, client) {
        //     client.getRoute(args, function(err, result) {
        //         if (err) throw err;
        //         calculatedRouteData = {
        //         	totalDistance: result.getRouteReturn.totalDistance.$value,
        //         	totalTime: result.getRouteReturn.totalTime.$value,
        //         }
        //         if (callback) callback(calculatedRouteData);
        //     });
        // });

        // TEMP CODE TO REPLACE SOAP API -- DELETE AFTER TESTING
        calculatedRouteData = {
            totalDistance: geolib.getDistance(startPoint, endPoint),
            totalTime: geolib.getDistance(startPoint, endPoint)
        };
        if (callback) callback(null, calculatedRouteData);
    }
};