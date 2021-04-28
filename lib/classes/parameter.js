'use strict';

const Abstract = require('./abstract');

const DEFAULT_PARAMETER_SCOPE = 
{
    list    : [ 'type', 'priority', 'sequence', 'unit', 'unitCode', 'label' ],
    detail  : [ 'type', 'priority', 'sequence', 'unit', 'unitCode', 'label' ]
};

const DEFAULT_PARAMETER_VALUE_SCOPE = 
{
    list    : [ 'sequence', 'data', 'label' ],
    detail  : [ 'sequence', 'data', 'label' ]
};

class ParameterValue extends Abstract
{
    static SCOPE = DEFAULT_PARAMETER_VALUE_SCOPE;

    static get( ctx, id, scope )
    {
        return Abstract.get( ParameterValue, ctx, id, scope );
    }

    static [Abstract.LOADER]( core ){ return core.parameter.value }
}

function ParameterInstance( parameter, values )
{
    return new Proxy( parameter,
    {
        get: ( target, property ) =>
        {
            if( property === 'value' ){ return values[0] }
            if( property === 'values' ){ return values }

            let value = target[property];

            if( typeof value === 'function' ){ value = value.bind( target )}
            
            return value;
        }
    });
}

module.exports = class Parameter extends Abstract
{
    static SCOPE = DEFAULT_PARAMETER_SCOPE;

    static get( ctx, id, scope, values = [])
    {
        const parameter = Abstract.get( Parameter, ctx, id, scope );
        const parameter_values = Array.isArray( values ) ? values.map( id => ParameterValue.get( ctx, id, 'list' )) : [ values ];

        return (( parameter instanceof Promise ) || ( parameter_values.find( p => p instanceof Promise )))
            ? Promise.all([ parameter, Promise.all( parameter_values ) ]).then(([ parameter, parameter_values ]) => ParameterInstance( parameter, parameter_values ))
            : ParameterInstance( parameter, parameter_values );
    }

    static [Abstract.LOADER]( core ){ return core.parameter }
}