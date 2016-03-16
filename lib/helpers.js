var Moment = require('moment');


var helpers = {
    getPointKey: function(point) {
        return Moment(point.ride_date).format(helpers.dateFormat) + ' D:' + point.driver_emp_id + ' R' + point.ride_no + ' #' + point.sequence_no;
    },
    dateFormat: 'YYYY-MM-DD',
    logPoint: function (point, prefix) {
        console.log(prefix + ' ' +helpers.getPointKey(point));
    }
};
module.exports = helpers;