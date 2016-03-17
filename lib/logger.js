var helpers = require('./helpers');

module.exports = {
    debug: function(msg){
        if(!helpers.production){
            console.log(msg);
        }
    },
    info: function(msg){
        console.info(msg);
    },
    warn: function(msg){
        console.warn(msg);
    },
    error: function(msg){
        console.error(msg);
    }
};
