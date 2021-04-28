'use strict';

const Abstract = require('./abstract');

const DEFAULT_SCOPE = 
{
    list    : [ 'groupID', 'enabled', 'parameters', 'images', 'tags', 'availability', 'rating', 'price', 'name' ],
    detail  : [ 'groupID', 'enabled', 'parameters', 'images', 'tags', 'availability', 'rating', 'price', 'name', 'shipping', 'brand', 'categories', 'galleries', 'suppliers', 'identifiers', 'timings', 'description' ],
};

module.exports = class Product extends Abstract
{
    static SCOPE = DEFAULT_SCOPE;

    static get( ctx, id, scope )
    {
        return Abstract.get( Product, ctx, id, scope );
    }

    static [Abstract.LOADER]( core ){ return core.product }

    [Abstract.RESOLVER]( property, value )
    {
        switch( property )
        {
            case 'categories'   : return Promise.all( value.map( id => require('./category').get( this[Abstract.CTX], id, 'list' )));
            case 'images'       : return Promise.all( value.map( id => require('./image').get( this[Abstract.CTX], id, 'list' )));
            case 'galleries'    : return Promise.all( value.map( id => require('./gallery').get( this[Abstract.CTX], id, 'list' )));
            case 'parameters'   : return Promise.all( ( Object.keys( value )).map( id => require('./parameter').get( this[Abstract.CTX], id, 'list' )));
        }
    }
}