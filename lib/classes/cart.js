'use strict';

const Abstract = require('./abstract');
const ObjectMerge = require('@liqd-js/alg-object-merge');
const Normalize = require('@liqd-js/normalize');

const NOOP = () => undefined;
const QUANTITY_RE = /^[+-][0-9]+$/;

const DEFAULT_SCOPE = 
{
    list    : [ 'products', 'customer', 'data', 'paymentID', 'shippingID' ],
    detail  : [ 'products', 'customer', 'data', 'paymentID', 'shippingID' ],
};

function toDecimals( value, decimals )
{
    return Math.round( value * Math.pow( 10, decimals )) / Math.pow( 10, decimals ); 
}

function toNumber( value )
{
    return parseFloat( value ); // TODO zlepsit - ak je number neparsovat, inak pozerat ,. a podla toho sa rozhodnut ci parseInt ci parseFloat
}

const CART_SCHEMA = 
{
    items: { _type: 'object', _each: 
    {
        _type: 'object',

        productID: { _required: true, _convert: $ => parseInt( $ ), _passes: $ => $ },
        quantity: { _required: true, _convert: $ => parseFloat( $ ), _passes: $ => $ },
    }},
    customer: 
    {
        _type: 'object',

        email   : { _type: 'string', _convert: $ => $.trim(), _passes: $ => /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test( $ )},
        phone   : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
        company : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
        name    : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
        address : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
        zip     : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
        city    : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
        country : { _type: 'string', _passes: $ => /^[A-Z]{2}$/.test($) },
        crn     : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
        tax     : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
        vat     : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
        note    : { _type: 'string', _convert: $ => $.trim() },

        shipping : 
        {
            _type: 'object',

            name    : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
            address : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
            zip     : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
            city    : { _type: 'string', _convert: $ => $.trim(), _passes: $ => $ },
            country : { _type: 'string', _passes: $ => /^[A-Z]{2}$/.test($) },
        }
    },
    paymentID   : { _type: 'string', _passes: $ => $ },
    shippingID  : { _type: 'string', _passes: $ => $ },
    data        : { _type: 'object', _strict: false }
}

class CartItem
{
    constructor( product, quantity )
    {
        this.product = product;
        this.quantity = quantity;
    }

    get price()
    {
        //tu bude cache ze neprepocitavame zakazdym jak cicikulpasi

        /*
        let price = item.product.price.current / ( 1 + ( this.#cart.noVAT ? item.product.price.vat : 0 ));
        let current = toDecimals( price * ( 1 - ( this.#cart.discount || 0 )), 4 );
        let original = toDecimals( price / ( 1 - ( item.product.price.discount || 0 )), 4 );
        let discount = toDecimals( original * ( item.product.price.discount || 0 ), 4 );
        let additionalDiscount = toDecimals( original - current - discount, 4 );*/

        return (
        {
            current: this.product.price.current, original: this.product.price.current, discount: 0, additionalDiscount: 0,
            vat     : this.product.price.vat,
            coupon  : 0
        });   

        return 'tu bude cena';
    }
}

class CartItems extends Array
{
    #ctx; #id;

    constructor( ctx, id )
    {
        super();

        this.#ctx = ctx;
        this.#id = id;
    }

    get count()
    {
        return this.reduce(( c, i ) => c += i.quantity, 0 );
    }

    async set( productID, quantity )
    {
        let item = this.find( i => i.product.id === productID );
        let product = item ? item.product : await this.#ctx.ecommerce.product( productID, 'list' );
        let original_quantity = item ? item.quantity : 0, difference;

        if( difference = ( typeof quantity === 'string' && QUANTITY_RE.test( quantity )))
        {
            quantity = original_quantity + ( quantity[0] === '+' ? 1 : -1 ) * parseFloat( quantity.substr( 1 ));
        }
        else{ quantity = parseFloat( quantity )}

        if( quantity > 0 )
        {
            const availability = product.availability, min = availability.min || 0, max = Math.min( availability.max || Infinity, availability.stock ), step = availability.step || 1;

            quantity = Math.max( min, Math.min( min + Math.floor(( max - min ) / step ) * step, min + Math.ceil(( quantity - min ) / step ) * step )); // TODO potestovat ked je stock mensie ako max co sa stane a co sa stane ked je stock 0
        }

        if( quantity == 0 )
        {
            if( item )
            {
                this.splice( this.findIndex( i => i.product.id === productID ), 1 );
                item.quantity = 0;
            }
        }
        else
        {
            if( !item )
            {
                this[ difference ? 'unshift' : 'push' ]( item = new CartItem( product, quantity ));

                // product.trend( 100 ); // TODO lepsie
            }
            else if( difference )
            {
                this.splice( this.findIndex( i => i.product.id === productID ), 1 );
                this.unshift( item );
            }
            
            item.quantity = quantity;
        }

        this.#ctx.core.session.cart.update( this.#id, { $set: { products: this.map( i => ({ productID: i.product.id, quantity: i.quantity }))}}, { upsert: true }).catch( NOOP );

        return { product, quantity, price: item ? item.price: {}, diff: quantity - original_quantity };
    }

    clear()
    {
        this.splice( 0, this.length );

        this.#ctx.core.session.cart.update( this.#id, { $set: { products: []}}).catch( NOOP );
    }
}

module.exports = class Cart extends Abstract
{
    static SCOPE = DEFAULT_SCOPE;

    static get( ctx, id, scope )
    {
        return Abstract.get( Cart, ctx, id, scope );
    }

    static [Abstract.LOADER]( core ){ return core.session.cart }

    [Abstract.RESOLVER]( property, value )
    {
        switch( property )
        {
            case 'products'     : return Promise.all( value.map( i => this.#items.set( i.productID, i.quantity ))).then( () => undefined );
            case 'customer'     : return ( this.#customer = value, undefined );
            case 'data'         : return ( this.#data = value, undefined );
            case 'paymentID'    : return ( this.#paymentID = value, undefined );
            case 'shippingID'   : return ( this.#shippingID = value, undefined );
        }
    }

    #items; #customer = {}; #data = {}; #vat = true; #paymentID; #shippingID;

    constructor( ctx, id )
    {
        super( ctx, id );

        this.#items = new CartItems( ctx, id );
    }

    get customer()
    {
        return this.#customer;
    }

    get items()
    {
        return this.#items;
    }

    get data()
    {
        return this.#data;
    }

    get vat()
    {
        return this.#vat;
    }

    get paymentID(){ return this.#paymentID }
    get shippingID(){ return this.#shippingID }

    price( options = {})
    {
        let current = 0, original = 0;

        for( let item of this.#items )
        {
            current += item.quantity * item.price.current;
            original += item.quantity * item.price.original;
        }

        return (
        {
            current, original, discount: 1 - current / original
        });
    }

    _scope()
    {
        const ctx = this[Abstract.CTX];

        return { country: ctx.flow.get('country') || ctx.country, locale: ctx.flow.get('locale') || ctx.locale }
    }

    get payments()
    {
        const { country, locale } = this._scope();
        const price = this.price().current;

        let payments = [];

        payment: for( let payment of this[Abstract.CTX].company.payments )
        {
            //console.log( payment );

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
                id          : payment.id,
                type        : payment.type,
                label       : payment.label[locale],
                description : payment.description[locale],
                price   :
                {
                    current     : toDecimals( payment.price[country] / ( !this.vat ? ( 1 + payment.vat[country] ) : 1 ), 2 ),
                    original    : toDecimals( payment.price[country] / ( !this.vat ? ( 1 + payment.vat[country] ) : 1 ), 2 ),
                    vat         : !this.vat ? 0 : payment.vat[country],
                    originalVat : payment.vat[country],
                    discount    : 0,
                    coupon      : 0
                },
                data    : payment.data
            });
        }

        return payments;
    }

    get shippings()
    {
        const { country, locale } = this._scope();
        const weight = 0,/*this.products.weight,*/ price = this.price().current;

        //console.log({ weight, price });

        let shippings = [];

        for( let shipping of this[Abstract.CTX].company.shippings )
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
                        current     : toDecimals( pkg.price[country] / ( !this.vat ? ( 1 + pkg.vat[country] ) : 1 ), 2 ),
                        original    : toDecimals( pkg.price[country] / ( !this.vat ? ( 1 + pkg.vat[country] ) : 1 ), 2 ),
                        vat         : !this.vat ? 0 : pkg.vat[country],
                        originalVat : pkg.vat[country],
                        discount    : 0,
                        coupon      : 0
                    },
                    delivery    : pkg.delivery[country],
                });
            }
        }

        return shippings;
    }

    async set( cart )
    {
        cart = Normalize( cart, CART_SCHEMA, { clone: true, strict: true }); 
        
        let update = {};

        ( cart.customer ) && ( update.customer = ObjectMerge( this.#customer, cart.customer ));
        ( cart.data ) && ( update.data = ObjectMerge( this.#data, cart.data ));

        if( cart.hasOwnProperty( 'paymentID' )) // TODO validacia
        {
            this.#paymentID = cart.paymentID;
            update.paymentID = cart.paymentID;
        }

        if( cart.hasOwnProperty( 'shippingID' )) // TODO validacia
        {
            this.#shippingID = cart.shippingID;
            update.shippingID = cart.shippingID;
        }

        if( Object.keys( update ).length )
        {
            this[Abstract.CTX].core.session.cart.update( this.id, { $set: update }, { upsert: true }).catch( NOOP );
        }

        return true;
    }

    async order( cart )
    {
        if( !cart.items || !cart.items.length ){ throw 'no products' }
        if( !cart.total ){ throw 'invalid price' }

        this.items.clear();
        await Promise.all( cart.items.map( i => this.items.set( parseInt( i.productID ), parseFloat( i.quantity ))));

        let price = this.price({ paymentID: this.paymentID, shippingID: this.shippingID });

        if( price.current.toFixed( 2 ) !== parseFloat( cart.total ).toFixed( 2 )){ throw 'invalid price' }

        let order = 
        {
            status      : 'new',
            locale      : 'sk',
            due         : 7,
            paid        : 0,
            customer    : this.customer,
            items       : [...this.items].map( i => (
            {
                id          : i.product.id,
                name        : i.product.name,
                //description : '',
                image       : i.product.images[0].url,
                url         : i.product.url,
                price       : i.price.current,
                vat         : i.price.vat,
                discount    : i.price.discount,
                quantity    : i.quantity,
                physical    : true
            })),
            currency    : 'EUR',
            price       : price.current,
            data        : this.#data
        };

        return require('util').inspect( order, { depth: Infinity, colors: true });

        //this.items.clear();

        //let order = await req.scope.session.cart.submit( body.data.total, { paymentID: _payment.id, shippingID: _shipping.id, website: req.scope.website });
        //if( !order || !order.no ){ throw 'could not create order' }
    }
}

// VELKE TODO Observable data