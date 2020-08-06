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

    static async get( ctx, id, scope )
    {
        id = parseInt( id );

        let category = CategoriesCache.get( ctx ).get( id, () => new Category( ctx, id ));

        scope && await category.load( scope );

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

    async load( scope )
    {
        if( this.id === 0 ){ return }

        const { country, locale } = this._scope();

        // TODO if scope list | detail

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

    get url()           { return '/' + this.title.slugify() + '-c' + this.id }
    get name()          { return this.#data.name?.[ this._scope().locale ]}
    get title()         { return this.#data.title?.[ this._scope().locale ]}
    get description()   { return this.#data.description?.[ this._scope().locale ]}
    get subcategories() { return this.#data.subcategories?.[ this._scope().country ]}

    async siblings()
    {
        const { country, locale } = this._scope();

        if( !this.#data.siblings?.[locale+'_'+country] )
        {
            let siblings = await this.#ctx.client.get( 'category/' + this.id + '/siblings', { query: { country, locale }}).then( r => r.json );

            if( !this.#data.siblings ){ this.#data.siblings = {}}

            this.#data.siblings[locale+'_'+country] = await Promise.all( siblings.map( id => Category.get( this.#ctx, id, 'list' )));
        }

        return this.#data.siblings[locale+'_'+country];
    }

    async children()
    {
        const { country, locale } = this._scope();

        if( !this.#data.children?.[locale+'_'+country] )
        {
            let children = await this.#ctx.client.get( 'category/' + this.id + '/children', { query: { country, locale }}).then( r => r.json );

            if( !this.#data.children ){ this.#data.children = {}}

            this.#data.children[locale+'_'+country] = await Promise.all( children.map( id => Category.get( this.#ctx, id, 'list' )));
        }

        return this.#data.children[locale+'_'+country];
    }

    async breadcrumb()
    {
        const { country, locale } = this._scope();

        if( !this.#data.breadcrumb?.[locale+'_'+country] )
        {
            let breadcrumb = await this.#ctx.client.get( 'category/' + this.id + '/breadcrumb', { query: { country, locale }}).then( r => r.json );

            if( !this.#data.breadcrumb ){ this.#data.breadcrumb = {}}

            this.#data.breadcrumb[locale+'_'+country] = await Promise.all( breadcrumb.map( id => Category.get( this.#ctx, id, 'list' )));
        }

        return this.#data.breadcrumb[locale+'_'+country];
    }

    async filter()
    {
        const { country, locale } = this._scope();

        if( !this.#data.filter?.[locale+'_'+country] )
        {
            let filter = await this.#ctx.client.get( 'category/' + this.id + '/filter', { query: { country, locale }}).then( r => r.json );

            filter.parameters = await Promise.all( Object.keys( filter.parameters ).map( id => Parameter.get( this.#ctx, parseInt( id ), filter.parameters[id] )));

            if( !this.#data.filter ){ this.#data.filter = {}}

            this.#data.filter[locale+'_'+country] = filter;
        }

        return this.#data.filter[locale+'_'+country];
    }

    async products( filter )
    {
        //if( !filter && this.#data.products?.[locale+'_'+country] ){ return this.#data.products[locale+'_'+country] }

        let products = await this.#ctx.client.get( 'category/' + this.id + '/products', { query:
        {
            country: this.#ctx.flow.get('country') || this.#ctx.country,
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            filter: filter ? JSON.stringify( filter ) : undefined
        }})
        .then( r => r.json );

        products.list = await Promise.all( products.list.map( id => ( require('./product') ).get( this.#ctx, id, 'list' )));

        if( !filter )
        {
            if( !this.#data.products ){ this.#data.products = {}}

            this.#data.products[locale+'_'+country] = products
        }

        return products;
    }
}