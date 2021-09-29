'use strict';

const Image = require('./classes/image');
const Gallery = require('./classes/gallery');
const Product = require('./classes/product');
//const Products = require('./classes/products');
const Parameter = require('./classes/parameter');
const Category = require('./classes/category');
const Session = require('./classes/session');
const Flow = require('@liqd-js/flow');

module.exports = class Ecommerce
{
    #options; #ctx;

    constructor( options )
    {
        this.#options = options;
        this.#ctx =
        {
            ecommerce: this,
            reviews: options.reviews,
            company: Object.freeze( options.company || {}),
            country: options.country,
            locale: options.locale,
            currency: options.currency,
            core: options.core,
            flow: options.flow || new Flow('@webergency/ecommerce'),
            scope: () => this.scope,
            multivalueScope: () => [...Object.values( this.scope )]
        };
    }

    get flow()
    {
        return this.#ctx.flow;
    }

    get scope()
    {
        return { country: this.#ctx.flow.get('country') || this.#ctx.country, locale: this.#ctx.flow.get('locale') || this.#ctx.locale, currency: this.#ctx.flow.get('currency') || this.#ctx.currency }
    }

    image( id, scope ){ return Image.get( this.#ctx, id, scope )}
    gallery( id, scope ){ return Gallery.get( this.#ctx, id, scope )}
    product( id, scope ){ return Product.get( this.#ctx, id, scope )}
    category( id, scope ){ return Category.get( this.#ctx, id, scope )}
    parameter( id, scope, values ){ return Parameter.get( this.#ctx, id, scope, values )}
    session( id, scope ){ return Session.get( this.#ctx, id, scope )}

    get reviews()
    {
        return this.#ctx.reviews;
    }

    /*get products()
    {
        return Products.get( this.#ctx );
    }*/

    /*async search( query )
    {
        const client = new Client();

        let search = await client.get( 'https://devel.hk-green.sk:8091/search', { query: { query, locale: this.scope.locale }}).then( r => r.json );

        console.log({ search });

        let [ products, categories ] = await Promise.all(
        [
            Promise.all( search.products.map( id => this.product( id, 'list' ))),
            Promise.all( search.categories.map( id => this.category( id, 'list' )))
        ])

        search.products = products;
        search.categories = categories;

        return search;
    }*/

    get company()
    {
        return this.#ctx.company;
    }

    /*get validator()
    {
        return Validator;
    }*/
}