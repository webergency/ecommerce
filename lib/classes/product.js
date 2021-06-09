'use strict';

const Abstract = require('./abstract');
const Group = require('./group');

const DEFAULT_SCOPE = 
{
    list    : [ 'groupID', 'url', 'enabled', 'parameters', 'images', 'tags', 'availability', 'rating', 'price', 'name', 'timings' ],
    detail  : [ 'groupID', 'url', 'enabled', 'parameters', 'images', 'tags', 'availability', 'rating', 'price', 'name', 'timings', 'shipping', 'brand', 'categories', 'galleries', 'suppliers', 'identifiers', 'timings', 'description' ],
    group   : [ 'url', 'enabled', 'parameters', 'images', 'tags', 'availability', 'rating', 'price', 'name' ],
};

module.exports = class Product extends Abstract
{
    static SCOPE = DEFAULT_SCOPE;

    static get( ctx, id, scope )
    {
        return Abstract.get( Product, ctx, id, scope );
    }

    static [Abstract.LOADER]( core ){ return core.product }

    #group; #reviews;

    [Abstract.RESOLVER]( property, value )
    {
        switch( property )
        {
            case 'groupID'      : return Group.get( this[Abstract.CTX], value ).then( g => (( this.#group = g ),  g.id ));
            case 'categories'   : return Promise.all( value.map( id => this[Abstract.CTX].ecommerce.category( id, 'list' )));
            case 'images'       : return Promise.all( value.map( id => this[Abstract.CTX].ecommerce.image( id, 'list' )));
            case 'galleries'    : return Promise.all( value.map( id => this[Abstract.CTX].ecommerce.gallery( id, 'list' )));
            case 'parameters'   : return Promise.all( ( Object.keys( value )).map( id => this[Abstract.CTX].ecommerce.parameter( id, 'list', value[id] )));
            case 'rating'       : return value.count ? this[Abstract.CTX].reviews.get( 'product', this.id ).then( r => (( this.#reviews = r ),  value )) : value;
        }
    }

    __set_group( group ) // TODO nepouzivat len group model
    {
        if( !this[Abstract.DATA].groupID )
        {
            this[Abstract.DATA].groupID = group.id;
            this.#group = group;
        }

        return group;
    }

    get group()
    {
        return this.#group;
    }

    get reviews()
    {
        return this.#reviews;
    }

    async trend( score = 1 )
    {
        //return this.#ctx.core2.product.trend( this.id, score );
    }
}