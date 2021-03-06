var Soap = require('soap');
var helpers = require('./helpers');

var getCoordinates = function (point, callback) {
    if(!helpers.production){
        // This is only for testing
        geoCoordinates = {
            latitude: 50.83927,
            longitude: 2.97577
        };
        return callback(null, geoCoordinates);
    }

    var city = point.city;
    var country = point.country;
    // Housenumber is in address
    var houseNumber = 0;
    var street = point.address;
    var postCode = point.postalcode;



    var geoCoordinates;
     var url = 'http://be-plw-tst-0009:8480/anymap/services/AdvGeocoder?wsdl';
     var args = {
         addressIn: {
             'attributes': {
                 'xsi:type': 'bean:GivenAddress',
                 'xmlns:bean': 'http://beans.soap.geosolutions.be'
             },
             'city': {
                 'attributes': {
                     'xsi:type': 'xsd:double'
                 },
                 $value: city
             },
             'country': {
                 'attributes': {
                     'xsi:type': 'xsd:double'
                 },
                 $value: country
             },
             'houseNumber': {
                 'attributes': {
                     'xsi:type': 'xsd:double'
                 },
                 $value: houseNumber
             },
             'postCode': {
                 'attributes': {
                     'xsi:type': 'xsd:double'
                 },
                 $value: postCode
             },
             'street': {
                 'attributes': {
                     'xsi:type': 'xsd:double'
                 },
                 $value: street
             }
         },
         // Number between 0 and 1. The bigger the number, the more accurate (but longer calc. time)
         minMatching: {
             'attributes': {
                 'xsi:type': 'xsd:double'
             },
             $value: 0.8
         },
         language: {
             'attributes': {
                 'xsi:type': 'xsd:string'
             },
             $value: 'en'
         }
     };

     Soap.createClient(url, function(err, client) {
         client.doGeocoding(args, function(err, result) {
             if (err) {
                 logger.warn('Could not get Coordinates for with following Points');
                 logger.warn(point);
                 return callback(err);
             }
             geoCoordinates = {
                 latitude: parseFloat(result.doGeocodingReturn.street.y.$value), // --> (!) y = latitude
                 longitude: parseFloat(result.doGeocodingReturn.street.x.$value) // --> (!) x = longitude
             };
             if (callback) callback(null,geoCoordinates);
         });
     });


};

module.exports = getCoordinates;