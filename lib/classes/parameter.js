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


module.exports = class Parameter extends Abstract
{
    static SCOPE = DEFAULT_PARAMETER_SCOPE;

    static get( ctx, id, scope )
    {
        return Abstract.get( Parameter, ctx, id, scope );
    }

    static [Abstract.LOADER]( core ){ return core.parameter }

    /*[Abstract.RESOLVER]( property, value )
    {
        switch( property )
        {
            case 'categories'   : return Promise.all( value.map( id => require('./category').get( this[Abstract.CTX], id )));
            case 'images'       : return Promise.all( value.map( id => require('./image').get( this[Abstract.CTX], id, 'dassda' )));
            case 'galleries'    : return Promise.all( value.map( id => require('./gallery').get( this[Abstract.CTX], id )));
        }
    }*/
}