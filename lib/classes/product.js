'use strict';

const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const ProductsCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Product
{
    #ctx; #data;

    static get( ctx, uid )
    {
        return ProductsCache.get( ctx ).get( uid, () => new Product( ctx, uid ));
    }

    constructor( ctx, uid )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'uid', { value: uid, writable: false, enumerable: true });
    }

    async data()
    {
        return this.#data || ( this.#data = await this.#ctx.client.get( 'product', { query: { uid: this.uid }}).then( r => r.json ));
    }

    async similar( count )
    {
        return await this.#ctx.client.get( 'products/similar', { query: { uid: this.uid, count }}).then( r => r.json ).then( s => s.map( uid => Product.get( this.#ctx, uid )));
    }
}