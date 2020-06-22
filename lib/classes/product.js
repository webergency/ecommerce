'use strict';

require('liqd-string')('');
const ObjectMerge = require('@liqd-js/alg-object-merge');
const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');
const Parameter = require('./parameter');
const Category = require('./category');

const ProductsCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Product
{
    #ctx; #data = {};

    static async get( ctx, id, scope )
    {
        id = parseInt( id );

        let product = ProductsCache.get( ctx ).get( id, () => new Product( ctx, id ));

        scope && await product.load( scope );

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

    async load( scope )
    {
        if( this.id === 0 ){ return }

        const { country, locale } = this._scope();

        let promises = [];

        if( this.#data.name?.[locale] === undefined || this.#data.price?.[country] === undefined )
        {
            promises.push( this.#ctx.core.call( 'get_product', { id: this.id, scope: 'list' }, { country, locale }).then( async( product ) =>
            {
                product.parameters = await Promise.all( Object.keys( product.parameters ).map( id => Parameter.get( this.#ctx, parseInt( id ), product.parameters[id] )));

                ObjectMerge( this.#data, 
                {
                    name        : { [locale]: product.name },
                    price       : { [country]: product.price },
                    images      : product.images,
                    parameters  : product.parameters,
                    tags        : product.tags
                });
            }));
        }

        if( this.#data.group === undefined )
        {
            promises.push( this.#ctx.core.call( 'get_product', { id: this.id, scope: 'group' }, { country, locale }).then( async( product ) =>
            {
                ObjectMerge( this.#data, 
                {
                    group: 
                    {
                        name: '',
                        description: ''
                    }
                },
                {
                    group: product.group // TODO locale & country
                },
                {
                    group:
                    {
                        url: '/' + product.group.name.slugify() + '-g' + product.group.id
                    }
                });
            }));
        }

        if( scope === 'detail' && ( this.#data.description?.[locale] === undefined || this.#data.availability?.[country] === undefined ))
        {
            promises.push( this.#ctx.core.call( 'get_product', { id: this.id, scope: 'detail' }, { country, locale }).then( async( product ) =>
            {
                product.categories = await Promise.all( product.categories.map( id => ( require('./category') ).get( this.#ctx, id, 'list' ))); // TODO preload pre locale

                ObjectMerge( this.#data, 
                {
                    description : { [locale]: product.description },
                    seo         : { [locale]: product.seo },
                    categories  : { [country]: product.categories },
                    identifiers : product.identifiers,
                    shipping    : product.shipping,
                    brand       : product.brand,
                    availability: { [country]: product.availability },
                    timings     : { [country]: product.timings },
                    rating      : product.rating,
                    galleries   : product.galleries
                });
            }));
        }

        console.log( this.#data );

        promises.length && await Promise.all( promises );
    }

    get url()
    {
        return '/' + this.name.slugify() + '-p' + this.id;
    }

    get name()          { return this.#data.name?.[ this._scope().locale ]}
    get description()   { return this.#data.description?.[ this._scope().locale ] }
    get seo()           { return this.#data.seo?.[ this._scope().locale ]}
    get categories()    { return this.#data.categories?.[ this._scope().country ]}
    get group()         { return this.#data.group }
    get identifiers()   { return this.#data.identifiers }
    get price()         { return this.#data.price?.[ this._scope().country ]}
    get images()        { return this.#data.images }
    get galleries()     { return this.#data.galleries }
    get parameters()    { return this.#data.parameters }
    get availability()  { return this.#data.availability?.[ this._scope().country ]}
    get timings()       { return this.#data.timings?.[ this._scope().country ]}
    get shipping()      { return this.#data.shipping }
    get brand()         { return this.#data.brand }
    get tags()          { return this.#data.tags }
    get rating()        { return this.#data.rating }

    async similar( count )
    {
        return await this.#ctx.client.get( 'products/similar', { query:
        {
            country: this.#ctx.flow.get('country') || this.#ctx.country,
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            id: this.id,
            count
        }})
        .then( r => r.json ).then( s => s.map( id => Product.get( this.#ctx, id, 'list' )));
    }
}