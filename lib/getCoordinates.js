var Soap = require('soap');

// var getCoordinates = function (city, country, houseNumber, postCode, street, callback) {
var getCoordinates = function (point, callback) {
    var geoCoordinates;
    // var url = 'http://be-plw-tst-0009:8480/anymap/services/AdvGeocoder?wsdl';
    // var args = {
    //     addressIn: {
    //         'attributes': {
    //             'xsi:type': 'bean:GivenAddress',
    //             'xmlns:bean': 'http://beans.soap.geosolutions.be'
    //         },
    //         'city': {
    //             'attributes': {
    //                 'xsi:type': 'xsd:double'
    //             },
    //             $value: city
    //         },
    //         'country': {
    //             'attributes': {
    //                 'xsi:type': 'xsd:double'
    //             },
    //             $value: country
    //         },
    //         'houseNumber': {
    //             'attributes': {
    //                 'xsi:type': 'xsd:double'
    //             },
    //             $value: houseNumber
    //         },
    //         'postCode': {
    //             'attributes': {
    //                 'xsi:type': 'xsd:double'
    //             },
    //             $value: postCode
    //         },
    //         'street': {
    //             'attributes': {
    //                 'xsi:type': 'xsd:double'
    //             },
    //             $value: street
    //         }
    //     },
    //     // Number between 0 and 1. The bigger the number, the more accurate (but longer calc. time)
    //     minMatching: {
    //         'attributes': {
    //             'xsi:type': 'xsd:double'
    //         },
    //         $value: 0.8
    //     },
    //     language: {
    //         'attributes': {
    //             'xsi:type': 'xsd:string'
    //         },
    //         $value: 'en'
    //     }
    // };

    // Soap.createClient(url, function(err, client) {
    //     client.doGeocoding(args, function(err, result) {
    //         if (err) throw err;
    //         geoCoordinates = {
    //             latitude: parseFloat(result.doGeocodingReturn.street.y.$value), // --> (!) y = latitude
    //             longitude: parseFloat(result.doGeocodingReturn.street.x.$value) // --> (!) x = longitude
    //         }
    //         if (callback) callback(geoCoordinates);
    //     });
    // });

    // TEMP CODE TO REPLACE SOAP API -- DELETE AFTER TESTING
    geoCoordinates = {
        latitude: 50.83927,
        longitude: 2.97577
    }
    callback(null, geoCoordinates);
};

module.exports = getCoordinates;