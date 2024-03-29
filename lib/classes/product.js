'use strict';

const Abstract = require('./abstract');
const Group = require('./group');

const DEFAULT_SCOPE = 
{
    list    : [ 'groupID', 'url', 'enabled', 'parameters', 'images', 'tags', 'availability', 'rating', 'price', 'name', 'timings', 'suppliers', 'categories' ],
    cart    : [ 'groupID', 'url', 'enabled', 'parameters', 'images', 'tags', 'availability', 'rating', 'price', 'name', 'timings', 'shipping', 'suppliers', 'categories' ],
    detail  : [ 'groupID', 'url', 'enabled', 'parameters', 'images', 'tags', 'availability', 'rating', 'price', 'name', 'title', 'seo', 'timings', 'shipping', 'brand', 'categories', 'galleries', 'suppliers', 'identifiers', 'timings', 'description', 'similar', 'redirect' ],
    group   : [ 'url', 'enabled', 'parameters', 'images', 'tags', 'availability', 'rating', 'price', 'name', 'timings', 'categories' ],
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
        if( property === 'url' && process.env.DEPLOYMENT )
        {
            [...Object.keys( value )].forEach( k => value[k] = value[k].replace( 'https://','https://' +  process.env.DEPLOYMENT.toLowerCase() + '.' ));
            
            return value;
        }

        switch( property )
        {
            case 'groupID'      : 
            {
                let group = Group.get( this[Abstract.CTX], value );

                return group instanceof Promise ? group.then( g => (( this.#group = g ), value )) : (( this.#group = group ), value );
            }
            case 'categories'   : return Promise.all( value.map( id => this[Abstract.CTX].ecommerce.category( id, 'list' )));
            case 'images'       : return Promise.all( value.map( id => this[Abstract.CTX].ecommerce.image( id, 'list' )));
            case 'galleries'    : return Promise.all( value.map( id => this[Abstract.CTX].ecommerce.gallery( id, 'list' )));
            case 'parameters'   : return Promise.all( ( Object.keys( value )).map( id => this[Abstract.CTX].ecommerce.parameter( id, 'list', value[id] )));
            case 'rating'       : return value.count ? this[Abstract.CTX].reviews.get( 'product', this.id ).then( r => (( this.#reviews = r ),  value )) : value;
            case 'similar'      : return Promise.all( value.map( id => this[Abstract.CTX].ecommerce.product( id, 'list' )));
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

    async trend( property, value = 1 )
    {
        return this[Abstract.CTX].core.product.trend( this.id, property, value, this[Abstract.CTX].ecommerce.scope.country );
    }
}