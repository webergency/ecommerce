const Product = require('./classes/product');
const Parameter = require('./classes/parameter');
const Category = require('./classes/category');
const Session = require('./classes/session');
const Client = require('@liqd-js/client');
const Flow = require('@liqd-js/flow');

const Ecommerce = module.exports = class Ecommerce
{
    #options; #ctx;

    constructor( options )
    {
        this.#options = options;
        this.#ctx =
        {
            country: options.country,
            locale: options.locale,
            client: new Client({ webroot: options.webroot }),
            flow: new Flow('@webergency/ecommerce')
        };
    }

    get flow()
    {
        return this.#ctx.flow;
    }

    product( id )
    {
        return Product.get( this.#ctx, id );
    }

    category( id )
    {
        return Category.get( this.#ctx, id );
    }

    parameter( id )
    {
        return Parameter.get( this.#ctx, id );
    }

    session( id )
    {
        return Session.get( this.#ctx, id );
    }
}