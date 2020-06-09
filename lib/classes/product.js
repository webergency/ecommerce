'use strict';

const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const ProductsCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Product
{
    #ctx; #data;

    static get( ctx, id, preload_scope )
    {
        let product = ProductsCache.get( ctx ).get( id, () => new Product( ctx, id ));

        preload_scope && product.data( preload_scope );

        return product;
    }

    constructor( ctx, id )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    async data( scope = 'list' )
    {
        // nextTick

        console.log( 'data', scope );

        let start = process.hrtime();

        return this.#data || ( this.#data = await this.#ctx.client.get( 'product', { query:
        {
            country: this.#ctx.flow.get('country') || this.#ctx.country,
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            id: this.id,
            scope
        }})
        .then( r => r.json )
        .then( p => 
        {
            let end = process.hrtime( start );

            console.log( this.id + ' took ' + ( end[0] * 1e3 + end[1] / 1e6 ).toFixed(2) + 'ms' );

            return p;
        }));
    }

    async similar( count )
    {
        return await this.#ctx.client.get( 'products/similar', { query:
        {
            country: this.#ctx.flow.get('country') || this.#ctx.country,
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            id: this.id,
            count
        }})
        .then( r => r.json ).then( s => s.map( id => Product.get( this.#ctx, id )));
    }
}