const Product = require('./classes/product');
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
        this.#ctx = { locale: options.locale, client: new Client({ webroot: options.webroot }), flow: new Flow('@webergency/ecommerce')};
    }

    get flow()
    {
        return this.#ctx.flow;
    }

    product( id )
    {
        return Product.get( this.#ctx, id );
    }

    category( uid )
    {
        return Category.get( this.#ctx, uid );
    }

    session( uid )
    {
        return Session.get( this.#ctx, uid );
    }
    
    get parameters()
    {
        return Session.get( this.#ctx, uid );
    }
}