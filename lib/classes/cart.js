'use strict';

const Abstract = require('./abstract');

const DEFAULT_SCOPE = 
{
    list    : undefined,
    detail  : undefined,
};

module.exports = class Cart extends Abstract
{
    static SCOPE = DEFAULT_SCOPE;

    static get( ctx, id, scope )
    {
        if( !id ){ id = randomID(); scope = undefined }

        return Abstract.get( Cart, ctx, id, scope );
    }

    static [Abstract.LOADER]( core ){ return core.session.cart }
}

// VELKE TODO Observable data