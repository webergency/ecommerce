'use strit';

function* ObjectSet( obj, path, value )
{
    let [ key, tail ] = path.split('.');

    if( tail.length )
    {
        if( typeof obj[key] !== 'object' )
        {
            obj[key] = {};

            return ObjectSet( obj[key], tail.join('.'), value );
        }
    }
    else{ return obj[key] = value }
}

module.exports = ObjectSet;