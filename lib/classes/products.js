'use strict';

require('liqd-string')('');
const ObjectMerge = require('@liqd-js/alg-object-merge');
const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');
const Product = require('./product');

const ProductsCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Products
{
    #ctx; #data = {};

    static get( ctx )
    {
        return ProductsCache.get( ctx, () => new Products( ctx ));
    }

    constructor( ctx )
    {
        this.#ctx = ctx;
    }

    _scope()
    {
        return { country: this.#ctx.flow.get('country') || this.#ctx.country, locale: this.#ctx.flow.get('locale') || this.#ctx.locale }
    }

    async group( id )
    {
        return await Promise.all( 
            await this.#ctx.core.call( 'get_products/group', { id }, this._scope() )
                .then( g => g.map( id => Product.get( this.#ctx, id, 'detail' )))
        );
    }

    async list( filter )
    {
        return await Promise.all(
            await this.#ctx.client.get( '/products/list', { query:
            {
                ...this._scope(),
                filter: filter ? JSON.stringify( filter ) : undefined
            }})
            .then( r => r.json )
            .then( p => p.map( id => Product.get( this.#ctx, id, 'list' )))
        );
    }
}