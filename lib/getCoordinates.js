var geolib = require('geolib');

var getCoordinates = function (point, callback) {
    // check the addres of the point from an async api and then return coordinates
    callback({
        latitude: '51.3152200000',
        longitude: '3.1871200000'
    });
};

module.exports = getCoordinates;