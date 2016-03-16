var db = require('./lib/db');
var Moment = require('moment');
var dateFormat = require('./helpers').dateFormat;
var assert = require('assert');


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
    // Mark route as processed
    // @todo: implement processed marking
    q.push('COMMIT;');
    if(e){
        return cb(e);
    }
    db.query(q.join('\n'), cb);
};

module.exports = {
    insertRoute: insertRouteDB
};