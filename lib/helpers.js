var Moment = require('moment');
var _ = require('lodash');
var logger = require('./logger');


var helpers = {
    getPointKey: function(point) {
        return Moment(point.ride_date).format(helpers.dateFormat) + ' D:' + point.driver_emp_id + ' R' + point.ride_no + ' #' + point.sequence_no;
    },
    dateFormat: 'YYYY-MM-DD',
    logPoint: function (point, prefix) {
        // Redundant, since the routes are logged at the end
        //logger.debug(prefix + ' ' +helpers.getPointKey(point));
    },
    logRoutes: function(allRoutes){
        var unique = _.map(allRoutes, function(r) {
            return {
                id: r.startPoint.ride_no,
                dr: r.startPoint.driver_emp_id,
                date: Moment(r.startPoint.ride_date).format(helpers.dateFormat),
                type: r.rideType,
                seq: r.sequenceNumber
            }
        });
        logger.debug('-------------------- Inserting ------------------');
        logger.debug(unique);
        logger.debug('-------------------------------------------------');
    },
    simplifyPoint: function(point){
        return {
            ride_no: point.ride_no,
            driver_emp_id: point.driver_emp_id,
            ride_date: Moment(point.ride_date).format(helpers.dateFormat)
        }
    },
    production: (process.env.NODE_ENV === 'production') ? true : false
};
module.exports = helpers;