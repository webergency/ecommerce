'use strict';

const Abstract = require('./abstract');

const DEFAULT_SCOPE = 
{
    list    : [ 'url', 'width', 'height', 'count', 'seoURL' ],
    detail  : [ 'url', 'width', 'height', 'count', 'seoURL', 'status', 'original' ]
};

module.exports = class Image extends Abstract
{
    static SCOPE = DEFAULT_SCOPE;

    static get( ctx, id, scope )
    {
        return Abstract.get( Image, ctx, id, scope );
    }

    static [Abstract.LOADER]( core ){ return core.image }
}