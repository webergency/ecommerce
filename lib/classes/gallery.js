'use strict';

const Abstract = require('./abstract');

const DEFAULT_SCOPE = 
{
    list    : [ 'images' ],
    detail  : [ 'images' ]
};

module.exports = class Gallery extends Abstract
{
    static SCOPE = DEFAULT_SCOPE;

    static get( ctx, id, scope )
    {
        return Abstract.get( Gallery, ctx, id, scope );
    }

    static [Abstract.LOADER]( core ){ return core.gallery }

    [Abstract.RESOLVER]( property, value )
    {
        switch( property )
        {
            case 'images': return Promise.all( value.map( id => require('./image').get( this[Abstract.CTX], id, 'list' )));
        }
    }
}