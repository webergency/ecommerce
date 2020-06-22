'use strict';

const { ObjectSet, ObjectGet, ObjectIterator } = require('../helpers/object');
const ObjectMerge = require('@liqd-js/alg-object-merge');
const Product = require('./product');
const Validator = require('./validator');

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
    #ctx; #cart;

    constructor( ctx, cart )
    {
        super();

        this.#ctx = ctx;
        this.#cart = cart;
    }

    get count()
    {
        return this.reduce(( s, p ) => s += p.quantity, 0 );
    }

    get price()
    {
        return this.reduce(( s, p ) => s += p.quantity * p.price.current, 0 );
    }

    get weight()
    {
        return this.reduce(( s, p ) => s += p.quantity * ( p.product.shipping.weight || NaN ), 0 );
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
                entry.price = 
                {
                    current : this.#cart.noVAT ? toDecimals( entry.product.price.current / ( 1 + entry.product.price.vat ), 2 ) : entry.product.price.current,
                    vat     : this.#cart.noVAT ? 0 : entry.product.price.vat,
                    discount: entry.product.price.discount
                }
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

    recalculate()
    {
        for( let entry of this )
        {
            entry.price = 
            {
                current : this.#cart.noVAT ? toDecimals( entry.product.price.current / ( 1 + entry.product.price.vat ), 2 ) : entry.product.price.current,
                vat     : this.#cart.noVAT ? 0 : entry.product.price.vat,
                discount: entry.product.price.discount
            }
        }
    }

    submit( options )
    {
        //{ shipment: 'id', payment: 'id' }
    }

    async _sync()
    {

    }
}

module.exports = class Cart
{
    #ctx; #customer; #noVAT = false;

    constructor( ctx, id )
    {
        this.#ctx = ctx;
        
        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
        Object.defineProperty( this, 'products', { value: new CartProducts( this.#ctx, this ), writable: false, enumerable: true });

        this.#customer = (
        {
            //id: null, automaticky fetchovat z user
            billing: { name: '', address: '', zip: '', city: '', country: '' },
            shipping: { name: '', address: '', zip: '', city: '', country: '' },
            crn: '', tax: '', vat: '', note: '', email: '', phone: '', data: {}
        });

        Object.defineProperty( this.#customer, 'set', { value: async( data ) =>
        {
            console.log('SET', data, this.#customer);

            let valid = true, errors = {};

            for( let { path, obj, key, value } of ObjectIterator( data ))
            {
                if([ 'billing.zip', 'shipping.zip', 'phone', 'email', 'crn', 'tax', 'vat' ].includes( path ) && value !== '' && ObjectGet( this.#customer, path ) !== value )
                {
                    try
                    {
                        obj[key] = value = Validator.normalize( value, key );
                    }
                    catch( e )
                    {
                        obj[key] = '';

                        ObjectSet( errors, path, valid = false );
                    }
                }
            }

            if( data.hasOwnProperty( 'vat' ) && this.#customer.vat !== data.vat )
            {
                if( data.vat )
                {
                    let companies = await Validator.company({ vat: data.vat = Validator.normalize( data.vat, 'vat' )});

                    this.#noVAT = ( companies.length && companies[0].vat === data.vat && companies[0].vat.substr(2) !== 'SK' ); // TODO dat krajinu z configu
                }
                else{ this.#noVAT = false }

                this.products.recalculate();
            }
            else if( data.email && this.#customer.email !== data.email )
            {
                if( !await Validator.email( data.email ))
                {
                    data.email = '';

                    ObjectSet( errors, 'email', valid = false );
                }
            }

            ObjectMerge( this.#customer, data );

            console.log( errors );

            if( !valid ){ throw errors }

            return this.customer;
        },
        writable: false, enumerable: false });
    }

    _scope()
    {
        return { country: this.#ctx.flow.get('country') || this.#ctx.country, locale: this.#ctx.flow.get('locale') || this.#ctx.locale }
    }

    get customer()
    {
        return this.#customer;
    }

    get noVAT()
    {
        return this.#noVAT;
    }

    get payments()
    {
        const { country, locale } = this._scope();
        const price = this.products.price;

        let payments = [];

        payment: for( let payment of this.#ctx.company.payments )
        {
            console.log( payment );

            if( payment.constraints )
            {
                for( let type in payment.constraints )
                {
                    let constraint = payment.constraints[type];

                    if( type === 'price' )
                    {
                        if( constraint.min && price < constraint.min[country] ){ continue payment; }
                        if( constraint.max && price > constraint.max[country] ){ continue payment; }
                    }
                }
            }

            payments.push(
            {
                id      : payment.id,
                type    : payment.type,
                label   : payment.label[locale],
                price   :
                {
                    current     : toDecimals( payment.price[country] / ( this.#noVAT ? 1.2 : 1 ), 2 ),
                    vat         : this.#noVAT ? 0 : 0.2,
                    discount    : 0
                },
                data    : payment.data
            });
        }

        console.log( payments );

        return payments;
    }

    get shippings()
    {
        const { country, locale } = this._scope();
        const weight = this.products.weight, price = this.products.price;

        console.log({ weight, price });

        let shippings = [];

        for( let shipping of this.#ctx.company.shippings )
        {
            pkg: for( let pkg of shipping.packages )
            {
                if( pkg.constraints )
                {
                    for( let type in pkg.constraints )
                    {
                        let constraint = pkg.constraints[type];

                        if( type === 'price' )
                        {
                            if( constraint.min && price < constraint.min[country] ){ continue pkg; }
                            if( constraint.max && price > constraint.max[country] ){ continue pkg; }
                        }
                        else if( type === 'weight' )
                        {
                            if( constraint.min && weight < constraint.min ){ continue pkg; }
                            if( constraint.max && weight > constraint.max ){ continue pkg; }
                        }
                    }
                }

                shippings.push(
                {
                    id          : pkg.id,
                    carrier     : shipping.carrier,
                    label       : shipping.label[locale],
                    price       :
                    {
                        current     : toDecimals( pkg.price[country] / ( this.#noVAT ? 1.2 : 1 ), 2 ),
                        vat         : this.#noVAT ? 0 : 0.2,
                        discount    : 0
                    },
                    delivery    : pkg.delivery[country],
                });
            }
        }

        return shippings;
    }
}