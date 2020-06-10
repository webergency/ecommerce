'use strict';

require('liqd-string')('');
const ObjectMerge = require('@liqd-js/alg-object-merge');
const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const ProductsCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Product
{
    #ctx; #data = {};

    static async get( ctx, id, preload_scope )
    {
        let product = ProductsCache.get( ctx ).get( id, () => new Product( ctx, id ));

        /*preload_scope &&*/ await product.load( preload_scope );

        return product;
    }

    constructor( ctx, id )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    _scope()
    {
        return { country: this.#ctx.flow.get('country') || this.#ctx.country, locale: this.#ctx.flow.get('locale') || this.#ctx.locale }
    }

    async load( scope = 'list' )
    {
        if( this.id === 0 ){ return }

        const { country, locale } = this._scope();

        let product = await this.#ctx.client.get( 'product', { query: { id: this.id, country, locale, scope }}).then( r => r.json );

        ObjectMerge( this.#data, 
        {
            name        : { [locale]: product.name },
            price       : { [country]: product.price },
            images      : product.images,
            parameters  : product.parameters,
            tags        : product.tags
        });
    }

    get url()
    {
        return '/' + this.name.slugify() + '-c' + this.id;
    }

    get name()
    {
        const { locale } = this._scope();

        return this.#data.name?.[ locale ];
    }

    get price()
    {
        const { country } = this._scope();

        return this.#data.price?.[ country ];
    }

    get images()
    {
        return this.#data.images;
    }

    get parameters()
    {
        return this.#data.parameters;
    }

    get tags()
    {
        return this.#data.tags;
    }

    async data( scope = 'list' )
    {
        // nextTick

        console.log( 'data', scope );

        let start = process.hrtime();

        return this.#data || ( this.#data = await this.#ctx.client.get( 'product', { query:
        {
            country: this.#ctx.flow.get('country') || this.#ctx.country,
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            id: this.id,
            scope
        }})
        .then( r => r.json )
        .then( p => 
        {
            let end = process.hrtime( start );

            console.log( this.id + ' took ' + ( end[0] * 1e3 + end[1] / 1e6 ).toFixed(2) + 'ms' );

            return p;
        }));
    }

    async similar( count )
    {
        return await this.#ctx.client.get( 'products/similar', { query:
        {
            country: this.#ctx.flow.get('country') || this.#ctx.country,
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            id: this.id,
            count
        }})
        .then( r => r.json ).then( s => s.map( id => Product.get( this.#ctx, id )));
    }
}