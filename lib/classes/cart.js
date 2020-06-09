'use strict';

const Product = require('./product');

const QUANTITY_RE = /^[+-][0-9]+$/;

class CartProducts
{
    #ctx; #list;

    constructor( ctx, id )
    {
        this.#ctx = ctx;
        this.#list = [];
        this.#data = {};

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    async list()
    {
        return this.#list;
    }

    async data()
    {
        return this.#data;
    }

    async _sync()
    {
        await this.#ctx.client.put( 'session/' + this.id + '/cart/products', { body: this.#list.map( p => ({ id: p.product.id, quantity: p.quantity }))});
    }

    async set( product_id, quantity )
    {
        if( quantity == 0 )
        {
            let index = this.#list.findIndex( e => e.product.id === product_id );

            ~index && this.#list.splice( index, 1 );
        }
        else
        {
            let entry = this.#list.find( e => e.product.id === product_id );

            if( typeof quantity === 'string' && QUANTITY_RE.test( quantity ))
            {
                quantity = ( quantity[0] === '+' ? 1 : -1 ) * parseInt( quantity.substr( 1 ));

                if( entry )
                {
                    if(( entry.quantity += quantity ) <= 0 )
                    {
                        this.#list.splice( this.#list.findIndex( e => e.product.id === product_id ), 1 );
                    }
                }
                else if( quantity >= 0 )
                {
                    this.#list.push({ product: Product.get( this.#ctx, product_id ), quantity });
                }
            }
            else
            {
                entry ? entry.quantity = parseInt( quantity ) : this.#list.push({ product: Product.get( this.#ctx, product_id ), quantity: parseInt( quantity )});
            }
        }

        await this._sync();
    }

    async clear()
    {
        this.#list = [];

        await this._sync();
    }
}

module.exports = class Cart
{
    #ctx; #products;

    constructor( ctx, id )
    {
        this.#ctx = ctx;
        
        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    get products()
    {
        return this.#products || ( this.#products = new CartProducts( this.#ctx, this.id ));
    }
}