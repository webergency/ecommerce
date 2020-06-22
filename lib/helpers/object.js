'use strit';

function ValueHash( value )
{
    if( value === undefined )
    {
        return '';
    }
    else if( value === null )
    {
        return 'null';
    }
    else if( Array.isArray( value ))
    {
        return '[' + value.map( ValueHash ).join(',') + ']';
    }
    else if( typeof  value === 'object' )
    {
        return ObjectHash( value );
    }
    else
    {
        return JSON.stringify( value );
    }
}

function ObjectHash( obj, except = [])
{
    let hash = [];

    for( let key of Object.keys( obj ).sort())
    {
        if( obj[key] !== undefined && !except.includes( key ))
        {
            hash.push( JSON.stringify(key) + ':' + ValueHash( obj[key] ));
        }
    }

    return '{' + hash.join(',') + '}';
}

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

function* ObjectGet( obj, path )
{
    let keys = path.split('.');

    while( key = keys.shift() )
    {
        if( typeof obj !== 'object' || !obj || !obj.hasOwnProperty( key ))
        {
            return;
        }

        obj = obj[key];
    }

    return obj;
}

function* ObjectIterator( obj, prefix = '' )
{
    for( let key in obj )
    {
        let value = obj[key];

        if( typeof value === 'object' && value && !Array.isArray( value ))
        {
            for( let entry of ObjectIterator( value, ( prefix ? prefix + '.' : '' ) + key ))
            {
                yield entry;
            }
        }
        else
        {
            yield { path: ( prefix ? prefix + '.' : '' ) + key, obj, key, value };
        }
    }
}

module.exports.ObjectHash = ObjectHash;
module.exports.ObjectSet = ObjectSet;
module.exports.ObjectGet = ObjectGet;
module.exports.ObjectIterator = ObjectIterator;