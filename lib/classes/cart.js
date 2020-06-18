'use strict';

const Product = require('./product');

const QUANTITY_RE = /^[+-][0-9]+$/;

function toDecimals( value, decimals )
{
    return Math.round( value * Math.pow( 10, decimals )) / Math.pow( 10, decimals ); 
}

class CartProducts
{
    #ctx; #list; #data;

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

    async set( product_id, quantity, data )
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
                    this.#list.splice( this.#list.findIndex( e => e.product.id === product_id ), 1 );

                    if(( entry.quantity += quantity ) > 0 )
                    {
                        this.#list.unshift( entry );
                    }
                }
                else if( quantity >= 0 )
                {
                    this.#list.unshift( entry = { product: await Product.get( this.#ctx, product_id, 'list' ), quantity });
                }
            }
            else
            {
                entry ? entry.quantity = parseInt( quantity ) : this.#list.push( entry = { product: await Product.get( this.#ctx, product_id, 'list' ), quantity: parseInt( quantity )});
            }

            // TODO lepsi
            if( entry.quantity > 0 && !entry.price )
            {
                //entry.price = { current: entry.product.price.current, vat: entry.product.price.vat, discount: entry.product.price.discount };
                entry.price = { current: toDecimals( entry.product.price.current / ( 1 + entry.product.price.vat ), 2), vat: 0, discount: entry.product.price.discount };
            }

            if( entry.quantity > 0 && ( entry.product.availability.step > 1 || entry.quantity > Math.min( entry.product.availability.max, entry.product.availability.stock )))
            {
                const a = entry.product.availability, min = a.min, max = Math.min( a.max, a.stock ), step = a.step;

                entry.quantity = Math.max( min, Math.min( max - ( max - min ) % step , entry.quantity + ( entry.quantity * step - ( entry.quantity - min )) % step ));
            }
        }

        this._sync();
    }

    async clear()
    {
        this.#list = [];

        this._sync();
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