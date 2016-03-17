var Moment = require('moment');
var _ = require('lodash');


var helpers = {
    getPointKey: function(point) {
        return Moment(point.ride_date).format(helpers.dateFormat) + ' D:' + point.driver_emp_id + ' R' + point.ride_no + ' #' + point.sequence_no;
    },
    dateFormat: 'YYYY-MM-DD',
    logPoint: function (point, prefix) {
        console.log(prefix + ' ' +helpers.getPointKey(point));
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
        console.info('-------------------- Inserting ------------------');
        console.info(unique);
        console.info('-------------------------------------------------');
    },
    production: (process.env.NODE_ENV === 'production') ? true : false
};
module.exports = helpers;