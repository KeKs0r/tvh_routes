var _ = require('lodash');
var Async = require('async');
var Moment = require('moment');

var db = require('./lib/db');
var logPoint = require('./helpers').logPoint;
var getRoute = require('./lib/getRoute');
var dateFormat = 'YYYY-MM-DD';


var getFirstSimulation = require('./Simul1');
var insertRoute = require('./common').insertRoute;

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
            '   ORDER BY ride_date ASC',
            '   LIMIT 100',
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
                    insertRoute(allRoutes, cb);
                }]
            }, nextRoute);
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


var getActual = function (points, cb) {
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
        cb(null, cleaned);
    });
};





