var production = (process.env.NODE_ENV === 'production') ? true : false;

var logger = {
    debug: function(msg){
        if(!production){
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

module.exports = logger;
