'use strict';

const Product = require('./product');

const QUANTITY_RE = /^[+-][0-9]+$/;

function toDecimals( value, decimals )
{
    return Math.round( value * Math.pow( 10, decimals )) / Math.pow( 10, decimals ); 
}

function toNumber( value )
{
    return parseFloat( value ); // TODO zlepsit - ak je number neparsovat, inak pozerat ,. a podla toho sa rozhodnut ci parseInt ci parseFloat
}

class CartProducts extends Array
{
    #ctx;

    constructor( ctx )
    {
        super();

        this.#ctx = ctx;
    }

    get count()
    {
        return this.reduce(( s, p ) => s += p.quantity, 0 );
    }

    get price()
    {
        return this.reduce(( s, p ) => s += p.quantity * p.price.current, 0 );
    }

    async set( productID, quantity, data ) // TODO zlepsit data - vyrobit dalsi produkt ked sa lisia v data
    {
        if( quantity == 0 )
        {
            let index = this.findIndex( e => e.product.id === productID );

            ~index && this.splice( index, 1 );
        }
        else
        {
            let entry = this.find( e => e.product.id === productID );

            if( typeof quantity === 'string' && QUANTITY_RE.test( quantity ))
            {
                quantity = ( quantity[0] === '+' ? 1 : -1 ) * parseFloat( quantity.substr( 1 ));

                if( entry )
                {
                    this.splice( this.findIndex( e => e.product.id === productID ), 1 );

                    if(( entry.quantity += quantity ) > 0 )
                    {
                        this.unshift( entry );
                    }
                }
                else if( quantity >= 0 )
                {
                    this.unshift( entry = { product: await Product.get( this.#ctx, productID, 'list' ), quantity, data });
                }
            }
            else
            {
                entry ? entry.quantity = parseFloat( quantity ) : this.push( entry = { product: await Product.get( this.#ctx, productID, 'list' ), quantity: parseFloat( quantity ), data });
            }

            // TODO lepsi
            if( entry.quantity > 0 && !entry.price )
            {
                //entry.price = { current: entry.product.price.current, vat: entry.product.price.vat, discount: entry.product.price.discount };
                entry.price = { current: toDecimals( entry.product.price.current / ( 1 + entry.product.price.vat + 0.1 ), 2), vat: 0.1, discount: entry.product.price.discount };
            }

            if( entry.quantity > 0 )
            {
                const a = entry.product.availability, min = a.min, max = Math.min( a.max, a.stock ), step = a.step;

                entry.quantity = Math.max( min, Math.min( min + Math.floor(( max - min ) / step ) * step, min + Math.ceil(( entry.quantity - min ) / step ) * step ));
            }
        }

        this._sync();
    }

    clear()
    {
        this.splice( 0, this.length );

        this._sync();
    }

    async _sync()
    {

    }
}

module.exports = class Cart
{
    #ctx; #customer;

    constructor( ctx, id )
    {
        this.#ctx = ctx;
        
        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
        Object.defineProperty( this, 'products', { value: new CartProducts( this.#ctx ), writable: false, enumerable: true });

        this.#customer = (
        {
            //id: null, automaticky fetchovat z user
            billing: 
            {
                name: '',
                address: '',
                zip: '',
                city: '',
                country: ''
            },
            shipping: 
            {
                name: '',
                address: '',
                zip: '',
                city: '',
                country: ''
            },
            crn: '', tax: '', vat: '', note: '', email: '', phone: '', data: {}
        });
    }

    get customer()
    {
        return this.#customer;
    }
}