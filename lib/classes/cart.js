'use strict';

const Abstract = require('./abstract');
const Clone = require('@liqd-js/clone');
const Client = require('@liqd-js/client');
const ObjectMerge = require('@liqd-js/alg-object-merge');
const Normalize = require('@liqd-js/normalize');

const NOOP = () => undefined;
const QUANTITY_RE = /^[+-][0-9]+$/;
const VATs = new Map();

async function isVAT( vat )
{
    if( !vat ){ return true }

    if( !VATs.has( vat ))
    {
        let res = await Client.get( 'https://api.billing.webergency.com/validator/vat', { query: { vat }}).then( r => r.json );

        VATs.set( vat, !Boolean( res.length && res[0].vatValid && res[0].country !== 'SK' ));
    }

    return VATs.get( vat );
}

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
        crn     : { _type: 'string', _convert: $ => $.replace(/\s+/g,'')/*, _passes: $ => $*/ },
        tax     : { _type: 'string', _convert: $ => $.replace(/\s+/g,'').trim()/*, _passes: $ => $*/ },
        vat     : { _type: 'string', _convert: $ => $.replace(/\s+/g,'').trim()/*, _passes: $ => $*/ },
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
    #cart;

    constructor( product, quantity, cart )
    {
        this.#cart = cart;
        this.product = product;
        this.quantity = quantity;
    }

    get price()
    {
        let { country } = this.#cart._scope();

        const product_price = this.product.rawJSON().price;
        
        let vat = this.#cart.vat ? product_price.vat['_'+country] : 0;
        let price = product_price.current['_'+country] / ( 1 + ( this.#cart.vat ? 0 : product_price.vat['_'+country] ));
        let discount = toDecimals( product_price.discount['_'+country] || 0, 4 ); // TODO additionalDiscount
        let current = toDecimals( price, 4 ); // TODO additionalDiscount
        let original = toDecimals( price / ( 1 - ( product_price.discount['_'+country] || 0 )), 4 );
        
        let originalDiscount = discount; // TODO additionalDiscount
        let additionalDiscount = 0; // TODO additionalDiscount

        let discounted = toDecimals( original - current, 4 );
        let originallyDiscounted = discounted; // TODO additionalDiscount
        let additionallyDiscounted = 0;  // TODO additionalDiscount

        return (
        {
            current, original, discount, originalDiscount, additionalDiscount, discounted, originallyDiscounted, additionallyDiscounted, vat, originalVat: product_price.vat['_'+country]
        });
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

    async set( productID, quantity, sync = true )
    {
        let item = this.find( i => i.product.id === productID );
        let product = item ? item.product : await this.#ctx.ecommerce.product( productID, 'cart' );
        let original_quantity = item ? item.quantity : 0, difference;

        if( difference = ( typeof quantity === 'string' && QUANTITY_RE.test( quantity )))
        {
            quantity = original_quantity + ( quantity[0] === '+' ? 1 : -1 ) * parseFloat( quantity.substr( 1 ));
        }
        else{ quantity = parseFloat( quantity )}

        if( quantity > 0 )
        {
            const availability = product.availability, min = Math.min( availability.min || 0, availability.stock ), max = Math.min( availability.max || Infinity, availability.stock ), step = availability.step || 1;

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
                this[ difference ? 'unshift' : 'push' ]( item = new CartItem( product, quantity, this.#ctx.cart ));

                // product.trend( 100 ); // TODO lepsie
            }
            else if( difference )
            {
                this.splice( this.findIndex( i => i.product.id === productID ), 1 );
                this.unshift( item );
            }
            
            item.quantity = quantity;
        }

        sync && this.sync();

        return { product, quantity, price: item ? item.price: {}, diff: quantity - original_quantity };
    }

    async sync()
    {
        await this.#ctx.core.session.cart.update( this.#id, { $set: { products: this.map( i => ({ productID: i.product.id, quantity: i.quantity }))}}, { upsert: true }).catch( NOOP );
    }

    clear( sync = true )
    {
        this.splice( 0, this.length );

        sync && this.sync();
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
            case 'products'     : return Promise.all( value.map( i => this.#items.set( i.productID, i.quantity, false ))).then( () => undefined );
            case 'customer'     : return ( this.#customer = value, value?.vat ? isVAT( value.vat ).then( vat => ( this.#vat = ( !this.#data.isCompany || vat ), undefined )) : undefined );
            case 'data'         : return ( this.#data = value, undefined ); // TODO isCompany
            case 'paymentID'    : return ( this.#paymentID = value, undefined );
            case 'shippingID'   : return ( this.#shippingID = value, undefined );
        }
    }

    #items; #customer = {}; #data = {}; #vat = true; #paymentID; #shippingID;

    constructor( ctx, id )
    {
        super( ctx, id );

        this.#items = new CartItems({ ...ctx, cart: this }, id );
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

        let paymentID = options.hasOwnProperty('paymentID') ? options.paymentID : this.#paymentID;
        let shippingID = options.hasOwnProperty('shippingID') ? options.shippingID : this.#shippingID;

        if( paymentID )
        {
            let payment = this.payments.find( p => p.id === paymentID )

            if( payment && payment.available )
            {
                current += payment.price.current;
                original += payment.price.original;
            }
        }

        if( shippingID )
        {
            let shipping = this.shippings.find( s => s.id === shippingID );

            if( shipping && shipping.available )
            {
                current += shipping.price.current;
                original += shipping.price.original;
            }
        }

        current = toDecimals( current, 2 );
        original = toDecimals( original, 2 );

        return (
        {
            current, original, discount: 1 - current / original
        });
    }

    _scope()
    {
        const ctx = this[Abstract.CTX];

        return { country: ctx.flow.get('cart-country') || ctx.flow.get('country') || ctx.country, locale: ctx.flow.get('locale') || ctx.locale }
    }

    get payments()
    {
        const { country, locale } = this._scope();
        const price = this.price({ paymentID: null, shippingID: null }).current;

        let payments = [];

        for( let payment of this[Abstract.CTX].company.payments )
        {
            let available = true, hint;

            if( payment.constraints )
            {
                for( let type in payment.constraints )
                {
                    let constraint = payment.constraints[type];

                    if( type === 'price' )
                    {
                        if( constraint.min && price < constraint.min[country] ){ available = false; hint = constraint?.min?.note?.[locale]; break; }
                        if( constraint.max && price > constraint.max[country] ){ available = false; hint = constraint?.max?.note?.[locale]; break; }
                    }

                    if( type === 'countries' )
                    {
                        if( !constraint.includes( country ) ){ available = false; break; }
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
                data    : payment.data,
                available,
                hint
            });
        }

        return payments;
    }

    get shippings()
    {
        const { country, locale } = this._scope();
        const weight = this.#items.reduce(( w, i ) => w += i.product.shipping?.weight || 0, 0 );
        const height = Math.max( 0, ...this.#items.map( i => i.product.shipping?.flexible === true ? 0 : ( i.product.shipping?.height || 0 ) / 100 ));
        const width = Math.max( 0, ...this.#items.map( i => i.product.shipping?.flexible === true ? 0 : ( i.product.shipping?.width || 0 ) / 100 ));
        const depth = Math.max( 0, ...this.#items.map( i => i.product.shipping?.flexible === true ? 0 : ( i.product.shipping?.depth || 0 ) / 100 ));
        const price = this.price({ paymentID: null, shippingID: null }).current;


        let shippings = [];

        for( let shipping of this[Abstract.CTX].company.shippings )
        {
            let pkgs = [];

            for( let pkg of shipping.packages )
            {
                let available = true, hint;

                if( pkg.constraints )
                {
                    for( let type in pkg.constraints )
                    {
                        let constraint = pkg.constraints[type];

                        if( type === 'price' )
                        {
                            if( constraint.min && price < constraint.min[country] ){ available = false; hint = constraint?.min?.note?.[locale] || constraint?.note?.[locale]; break; }
                            if( constraint.max && price > constraint.max[country] ){ available = false; hint = constraint?.max?.note?.[locale] || constraint?.note?.[locale]; break; }
                        }
                        else if( type === 'weight' )
                        {
                            if( constraint.min && weight < constraint.min ){ available = false; hint = constraint?.min?.note?.[locale] || constraint?.note?.[locale]; break; }
                            if( constraint.max && weight > constraint.max ){ available = false; hint = constraint?.max?.note?.[locale] || constraint?.note?.[locale]; break; }
                        }
                        else if( type === 'height' )
                        {
                            if( constraint.min && height < constraint.min ){ available = false; hint = constraint?.min?.note?.[locale] || constraint?.note?.[locale]; break; }
                            if( constraint.max && height > constraint.max ){ available = false; hint = constraint?.max?.note?.[locale] || constraint?.note?.[locale]; break; }
                        }
                        else if( type === 'width' )
                        {
                            if( constraint.min && width < constraint.min ){ available = false; hint = constraint?.min?.note?.[locale] || constraint?.note?.[locale]; break; }
                            if( constraint.max && width > constraint.max ){ available = false; hint = constraint?.max?.note?.[locale] || constraint?.note?.[locale]; break; }
                        }
                        else if( type === 'depth' )
                        {
                            if( constraint.min && depth < constraint.min ){ available = false; hint = constraint?.min?.note?.[locale] || constraint?.note?.[locale]; break; }
                            if( constraint.max && depth > constraint.max ){ available = false; hint = constraint?.max?.note?.[locale] || constraint?.note?.[locale]; break; }
                        }
                        else if( type === 'zone' )
                        {
                            if( !constraint.includes( country ) ){ available = false; break; }
                        }
                    }
                }

                pkgs.push(
                {
                    id          : pkg.id,
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
                    available,
                    hint
                });
            }

            shippings.push( pkgs.find( p => p.available ) || pkgs[0] );
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

        //if( cart.customer.hasOwnProperty 'vat' ))
        {
            this.#vat = ( !this.#data.isCompany || await isVAT( this.#customer.vat ));
        }

        return true;
    }

    async order( cart )
    {
        if( !cart.items || !cart.items.length ){ throw 'no products' }
        if( !cart.total ){ throw 'invalid price' }

        await this.set( cart );

        this.items.clear( false );
        await Promise.all( cart.items.map( i => this.items.set( parseInt( i.productID ), parseFloat( i.quantity ), false )));
        await this.items.sync();

        let price = this.price();

        if( price.current.toFixed( 2 ) !== parseFloat( cart.total ).toFixed( 2 )){ throw 'invalid price' }

        let payment     = this.payments.find( f => f.id === cart.paymentID );
        let shipping    = this.shippings.find( f => f.id === cart.shippingID );

        let order =
        {
            status      : 'new',
            locale      : 'sk',
            due         : 7,
            paid        : 0,
            customer    : Clone( this.customer ),
            note        : this.customer.note,
            items       : [...this.items].map( i => (
            {
                id          : i.product.id,
                name        : i.product.name,
                //description : '',
                image       : i.product.images[0].url,
                url         : i.product.url,
                price       : i.price.current,
                vat         : i.price.originalVat,
                discount    : i.price.discount,
                quantity    : i.quantity,
                physical    : true,
                supplier    : i.product.suppliers.find( f => ['eurogreens', 'maxifleur', 'prosperplast', 'kunsthaagvoordeel'].includes( f.id ))
            })),
            payment     :
            {
                id      : payment.id,
                name    : payment.label,
                price   : payment.price.current,
                discount: payment.price.discount,
                vat     : payment.price.originalVat
            },
            shipping    :
            {
                id      : shipping.id,
                name    : shipping.label,
                price   : shipping.price.current,
                discount: shipping.price.discount,
                vat     : shipping.price.originalVat,
                data    : cart?.data?.packeta
            },
            currency    : 'EUR',
            price       : price.current,
            vat         : this.vat
        };

        if( !this.#data.isCompany )
        {
            delete order.customer.company;
            delete order.customer.crn;
            delete order.customer.tax;
            delete order.customer.vat;
        }

        if( this.#data.shippingAddress !== "" )
        {
            delete order.customer.shipping;
        }

        return order;

        return require('util').inspect( order, { depth: Infinity, colors: true });

        //this.items.clear();

        //let order = await req.scope.session.cart.submit( body.data.total, { paymentID: _payment.id, shippingID: _shipping.id, website: req.scope.website });
        //if( !order || !order.no ){ throw 'could not create order' }
    }
}

// VELKE TODO Observable data