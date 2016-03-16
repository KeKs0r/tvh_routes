var db = require('./db');
var Moment = require('moment');
var dateFormat = require('./helpers').dateFormat;
var assert = require('assert');
var Async = require('async');
var _ = require('lodash');


var hasError = function(r){
    try {
        assert(r.startPoint, 'r.startPoint');
        assert(r.startPoint.ride_no, 'r.startPoint.ride_no');
        assert(r.startPoint.driver_emp_id, 'r.startPoint.driver_emp_id');
        var date = Moment(r.startPoint.ride_date);
        assert(date.isValid(), 'date');
        assert(r.startPoint.latitude, 'r.startPoint.latitude');
        assert(r.startPoint.longitude, 'r.startPoint.longitude');
        assert(r.endPoint.latitude, 'r.endPoint.latitude');
        assert(r.endPoint.longitude, 'r.endPoint.longitude');
        assert(r.rideType , 'r.rideType');
        // Assertions fail due to value can be 0
        //assert(r.route.totalDistance , 'r.route.totalDistance');
        //assert(r.route.totalTime, 'r.route.totalTime');
        return false;
    } catch(e){
        console.error(e.message);
        console.warn(r);
        return e.message;
    }

};

var insertRouteDB = function (routes, cb) {
    var e = null;
    var q = [
        'BEGIN;',
        'INSERT INTO warehouse.rental_transport_routes',
        '   (ride_no, sequence_no, driver_emp_id, ride_date, from_latitude, from_longitude, to_latitude, to_longitude, ride_type, distance, route_time)',
        '   VALUES '
    ];
    var inserts = [];
    routes.forEach(function (r) {
        if(hasError(r)){
            e = hasError(r);
        }
        var date = Moment(r.startPoint.ride_date).format(dateFormat);
        var single = '(' + [
                r.startPoint.ride_no,
                r.sequenceNumber,
                r.startPoint.driver_emp_id,
                "date '" + date + "'",
                r.startPoint.latitude,
                r.startPoint.longitude,
                r.endPoint.latitude,
                r.endPoint.longitude,
                '\'' + r.rideType + '\'',
                r.route.totalDistance,
                r.route.totalTime
            ].join(',') + ' ) ';
        inserts.push(single);
    });
    q.push(inserts.join(',\n'));
    q.push(';');
    // Mark route as processed
    // @todo: implement processed marking
    var f = _.first(routes);
    var date = "date '" +  Moment(f.startPoint.ride_date).format(dateFormat) + "'";
    var update = [
        'UPDATE warehouse.rental_transport_points',
        '   SET processed_date = now()',
        '   WHERE ',
        '       driver_emp_id = \''+ f.startPoint.driver_emp_id+'\'',
        '   AND ride_no = '+ f.startPoint.ride_no,
        '   AND ride_date = '+date,
        ';'
    ];
    q.push(update.join('\n'));
    q.push('COMMIT;');
    if(e){
        return cb(e);
    }
    db.query(q.join('\n'), cb);
};


var reverseRoute = ['route', function(cb, res){
    var towards = res.route;

    var startPoint = towards.endPoint;
    startPoint.ride_no = towards.startPoint.ride_no;
    startPoint.driver_emp_id = towards.startPoint.driver_emp_id;
    startPoint.ride_date = towards.startPoint.ride_date;


    var reverse = {
        route: towards.route,
        startPoint: startPoint,
        endPoint: towards.startPoint,
        sequenceNumber: towards.sequenceNumber + 1,
        rideType: 'Simul 1'
    };
    cb(null, reverse);
}];



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

module.exports = {
    insertRoute: insertRouteDB,
    findAllDepots: findAllDepots,
    reverseRoute: reverseRoute
};