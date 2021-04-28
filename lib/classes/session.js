'use strict';

const Abstract = require('./abstract');

const randomID = () => ( Date.now() % 90028800000 ) * 100000 + Math.floor( Math.random() * 100000 ); //( 1042 * 24 * 60 * 60 * 1000 )

const DEFAULT_SCOPE = 
{
    list    : undefined,
    detail  : undefined,
};

module.exports = class Session extends Abstract
{
    static SCOPE = DEFAULT_SCOPE;

    static get( ctx, id, scope )
    {
        if( !id ){ id = randomID(); scope = undefined }

        return Abstract.get( Session, ctx, id, scope );
    }

    static [Abstract.LOADER]( core ){ return core.session }
}

// VELKE TODO Observable data
// TODO Load cart