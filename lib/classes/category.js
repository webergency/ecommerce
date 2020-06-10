'use strict';

require('liqd-string')('');
const ObjectMerge = require('@liqd-js/alg-object-merge');
const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');
const Product = require('./product');
const Parameter = require('./parameter');

const CategoriesCache = new DefaultWeakMap(() => new DefaultMap());

const Category = module.exports = class Category
{
    #ctx; #data = {};

    static async get( ctx, id, preload_scope )
    {
        let category = CategoriesCache.get( ctx ).get( id, () => new Category( ctx, id ));

        /*preload_scope &&*/ await category.load( preload_scope );

        return category;
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

    async load( scope = 'full' )
    {
        if( this.id === 0 ){ return }

        const { country, locale } = this._scope();

        let category = await this.#ctx.client.get( 'category/' + this.id, { query: { country, locale }}).then( r => r.json );

        ObjectMerge( this.#data, 
        {
            name        : { [locale]: category.name },
            title       : { [locale]: category.title },
            description : { [locale]: category.description }
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

    get title()
    {
        const { locale } = this._scope();

        return this.#data.title?.[ locale ];
    }

    get description()
    {
        const { locale } = this._scope();

        return this.#data.description?.[ locale ];
    }

    async siblings()
    {
        const { country, locale } = this._scope();

        let siblings = await this.#ctx.client.get( 'category/' + this.id + '/siblings', { query: { country, locale }}).then( r => r.json );

        return Promise.all( siblings.map( id => Category.get( this.#ctx, id )));
    }

    async children()
    {
        const { country, locale } = this._scope();

        let children = await this.#ctx.client.get( 'category/' + this.id + '/children', { query: { country, locale }}).then( r => r.json );

        return Promise.all( children.map( id => Category.get( this.#ctx, id )));
    }

    async breadcrumb()
    {
        const { country, locale } = this._scope();

        let breadcrumb = await this.#ctx.client.get( 'category/' + this.id + '/breadcrumb', { query: { country, locale }}).then( r => r.json );

        return Promise.all( breadcrumb.map( id => Category.get( this.#ctx, id )));
    }

    async filter()
    {
        const { country, locale } = this._scope();

        let filter = await this.#ctx.client.get( 'category/' + this.id + '/filter', { query: { country, locale }}).then( r => r.json );

        console.log( filter.parameters );

        for( let parameterID in filter.parameters )
        {
            let parameter = await Parameter.get( this.#ctx, parseInt( parameterID ), filter.parameters[parameterID] );

            console.log( parameter, parameter.label );
        }

        return filter;
    }

    async products( filter )
    {
        let products = await this.#ctx.client.get( 'category/' + this.id + '/products', { query:
        {
            country: this.#ctx.flow.get('country') || this.#ctx.country,
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            filter
        }})
        .then( r => r.json );

        // TODO vraciat v headeroch page a count;

        products.list = await Promise.all( products.list.map( id => Product.get( this.#ctx, id, 'list' )));

        return products;

        /*
        filter = 
        {
            query: 'textova query',
            parameters: { 1: 3123, 2: [ 312, 23131 ], 3: { from: 12, to: 42342 }},
            sort: 'sdasda',
            limit: 30,
            page: 2 // after: 31231 // id produktu
        }*/
    }
}

//console.log( Object.getOwnPropertyDescriptors( Category.prototype ));

//Object.defineProperty( Category, 'name', { enumerable: true });