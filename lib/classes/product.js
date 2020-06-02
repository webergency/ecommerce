'use strict';

const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const ProductsCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Product
{
    #ctx; #data;

    static get( ctx, id )
    {
        return ProductsCache.get( ctx ).get( id, () => new Product( ctx, id ));
    }

    constructor( ctx, id )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    async data( scope = 'list' )
    {
        return this.#data || ( this.#data = await this.#ctx.client.get( 'product', { query:
        {
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            id: this.id,
            scope
        }})
        .then( r => r.json ));
    }

    async similar( count )
    {
        return await this.#ctx.client.get( 'products/similar', { query:
        {
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            id: this.id,
            count
        }})
        .then( r => r.json ).then( s => s.map( id => Product.get( this.#ctx, id )));
    }

    grouped_variants
}