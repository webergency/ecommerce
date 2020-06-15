'use strict';

require('liqd-string')('');
const ObjectMerge = require('@liqd-js/alg-object-merge');
const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');
//const Product = require('./product');
const Parameter = require('./parameter');

const CategoriesCache = new DefaultWeakMap(() => new DefaultMap());

const Category = module.exports = class Category
{
    #ctx; #data = {};

    static async get( ctx, id, preload_scope )
    {
        id = parseInt( id );

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

        if( this.#data.name?.[locale] === undefined || this.#data.subcategories?.[country] === undefined )
        {
            let category = await this.#ctx.core.call( 'get_category', { id: this.id, scope }, { country, locale });

            ObjectMerge( this.#data, 
            {
                name            : { [locale]: category.name || category.title || this.id.toString() },
                title           : { [locale]: category.title || category.name || this.id.toString() },
                description     : { [locale]: category.description || '' },
                subcategories   : { [country]: category.subcategories || 0 },
            });
        }
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

    get subcategories()
    {
        const { country } = this._scope();

        return this.#data.subcategories?.[ country ];
    }

    async siblings()
    {
        const { country, locale } = this._scope();

        if( !this.#data.siblings )
        {
            let siblings = await this.#ctx.client.get( 'category/' + this.id + '/siblings', { query: { country, locale }}).then( r => r.json );

            this.#data.siblings = await Promise.all( siblings.map( id => Category.get( this.#ctx, id )));
        }

        return this.#data.siblings;
    }

    async children()
    {
        const { country, locale } = this._scope();

        if( !this.#data.children )
        {
            let children = await this.#ctx.client.get( 'category/' + this.id + '/children', { query: { country, locale }}).then( r => r.json );

            this.#data.children = await Promise.all( children.map( id => Category.get( this.#ctx, id )));
        }

        return this.#data.children;
    }

    async breadcrumb()
    {
        const { country, locale } = this._scope();

        if( !this.#data.breadcrumb )
        {
            let breadcrumb = await this.#ctx.client.get( 'category/' + this.id + '/breadcrumb', { query: { country, locale }}).then( r => r.json );

            this.#data.breadcrumb = await Promise.all( breadcrumb.map( id => Category.get( this.#ctx, id )));
        }

        return this.#data.breadcrumb;
    }

    async filter()
    {
        const { country, locale } = this._scope();

        if( !this.#data.filter )
        {
            let filter = await this.#ctx.client.get( 'category/' + this.id + '/filter', { query: { country, locale }}).then( r => r.json );

            filter.parameters = await Promise.all( Object.keys( filter.parameters ).map( id => Parameter.get( this.#ctx, parseInt( id ), filter.parameters[id] )));

            this.#data.filter = filter;
        }

        return this.#data.filter;
    }

    async products( filter )
    {
        if( !filter && this.#data.products ){ return this.#data.products }

        let products = await this.#ctx.client.get( 'category/' + this.id + '/products', { query:
        {
            country: this.#ctx.flow.get('country') || this.#ctx.country,
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            filter
        }})
        .then( r => r.json );

        // TODO vraciat v headeroch page a count;

        products.list = await Promise.all( products.list.map( id => ( require('./product') ).get( this.#ctx, id, 'group' )));

        if( !filter ){ this.#data.products = products }

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