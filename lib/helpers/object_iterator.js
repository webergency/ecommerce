'use strit';

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

module.exports = ObjectIterator;