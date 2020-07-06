const Image = require('./classes/image');
const Gallery = require('./classes/gallery');
const Product = require('./classes/product');
const Products = require('./classes/products');
const Parameter = require('./classes/parameter');
const Category = require('./classes/category');
const Session = require('./classes/session');
const Flow = require('@liqd-js/flow');
const Client = require('@liqd-js/client');
const EcommerceCore = require('./core/ecommerce');
const EcommerceCore2 = require('./core/ecommerce2');
const Validator = require('./classes/validator');

const Ecommerce = module.exports = class Ecommerce
{
    #options; #ctx;

    constructor( options )
    {
        this.#options = options;
        this.#ctx =
        {
            company: Object.freeze( options.company || {}),
            websites: Object.freeze( options.websites || {}),
            country: options.country,
            locale: options.locale,
            core: new EcommerceCore({ webroot: options.webroot }),
            core2: new EcommerceCore2({ webroot: options.webroot, ecommerce: this }),
            client: new (require('@liqd-js/client'))({ webroot: options.webroot }),
            flow: new Flow('@webergency/ecommerce'),
            scope: () => this.scope
        };

        /*setTimeout( async() =>
        {
            let [ parameter, value ] = await Promise.all(
            [
                this.#ctx.core2.parameter.get( 1 ),
                this.#ctx.core2.parameter.values( 1 )
            ]);
            
            console.log(  parameter, value );
        },
        1 );*/
    }

    get flow()
    {
        return this.#ctx.flow;
    }

    get scope()
    {
        return { country: this.#ctx.flow.get('country') || this.#ctx.country, locale: this.#ctx.flow.get('locale') || this.#ctx.locale }
    }

    image( id )
    {
        return Image.get( this.#ctx, id );
    }

    gallery( id )
    {
        return Gallery.get( this.#ctx, id );
    }

    product( id, scope )
    {
        return Product.get( this.#ctx, id, scope );
    }

    get products()
    {
        return Products.get( this.#ctx );
    }

    category( id, scope )
    {
        return Category.get( this.#ctx, id, scope );
    }

    parameter( id, valueIDs )
    {
        return Parameter.get( this.#ctx, id, valueIDs );
    }

    session( id, scope )
    {
        return Session.get( this.#ctx, id, scope );
    }

    async search( query )
    {
        const client = new Client();

        let search = await client.get( 'https://devel.hk-green.sk:8091/search', { query: { query, locale: this.scope.locale }}).then( r => r.json );

        let [ products, categories ] = await Promise.all(
        [
            Promise.all( search.products.map( id => this.product( id, 'list' ))),
            Promise.all( search.categories.map( id => this.category( id, 'list' )))
        ])

        search.products = products;
        search.categories = categories;
    }

    get company()
    {
        return this.#ctx.company;
    }

    get validator()
    {
        return Validator;
    }
}