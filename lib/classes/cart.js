'use strict';

const Product = require('./product');

class CartProducts
{
    #ctx; #list;

    constructor( ctx, uid )
    {
        this.#ctx = ctx;
        this.#list = [];

        Object.defineProperty( this, 'uid', { value: uid, writable: false, enumerable: true });
    }

    async list()
    {
        return this.#list;
    }

    async set( product_uid, quantity )
    {
        if( quantity === 0 )
        {
            let index = this.#list.findIndex( e => e.product.uid === product_uid );

            ~index && this.#list.splice( index, 1 );
        }
        else
        {
            let entry = this.#list.find( e => e.product.uid === product_uid );

            entry ? entry.quantity = quantity : this.#list.push({ product: Product.get( this.#ctx, product_uid ), quantity });
        }
    }

    async clear()
    {
        this.#list = [];
    }
}

module.exports = class Cart
{
    #ctx; #products;

    constructor( ctx, uid )
    {
        this.#ctx = ctx;
        
        Object.defineProperty( this, 'uid', { value: uid, writable: false, enumerable: true });
    }

    get products()
    {
        return this.#products || ( this.#products = new CartProducts( this.#ctx, this.uid ));
    }
}