const Product = require('./classes/product');
const Category = require('./classes/category');
const Session = require('./classes/session');
const Client = require('@liqd-js/client');

const Ecommerce = module.exports = class Ecommerce
{
    #options; #ctx;

    constructor( options )
    {
        this.#options = options;
        this.#ctx = { client: new Client({ webroot: options.webroot })};
    }

    product( uid )
    {
        return Product.get( this.#ctx, uid );
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