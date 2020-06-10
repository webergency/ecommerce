module.exports = function enumeratePrototypeGetters( instance )
{
    const getters = {}, descriptors = Object.getOwnPropertyDescriptors( instance.constructor.prototype );
    
    for( let property in descriptors )
    {
        if( descriptors[property].hasOwnProperty('get'))
        {
            descriptors[property].enumerable = true;
            getters[property] = descriptors[property];
        }
    }

    Object.defineProperties( instance, getters );
}