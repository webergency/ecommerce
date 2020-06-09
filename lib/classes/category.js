'use strict';

const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');
const Product = require('./product');

const CategoriesCache = new DefaultWeakMap(() => new DefaultMap());

const Category = module.exports = class Category
{
    #ctx; #id;

    static get( ctx, id )
    {
        return CategoriesCache.get( ctx ).get( id, () => new Category( ctx, id ));
    }

    constructor( ctx, id )
    {
        this.#ctx = ctx;
        this.#id = id;
    }

    get id(){ return this.#id }

    async filter()
    {
        return await this.#ctx.client.get( 'category/' + this.#id + '/filter', { query:
        {
            country: this.#ctx.flow.get('country') || this.#ctx.country,
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            //filter
        }})
    }

    async products( filter )
    {
        let products = await this.#ctx.client.get( 'category/' + this.#id + '/products', { query:
        {
            country: this.#ctx.flow.get('country') || this.#ctx.country,
            locale: this.#ctx.flow.get('locale') || this.#ctx.locale,
            filter
        }})
        .then( r => r.json );

        products.list = products.list.map( id => Product.get( this.#ctx, id, 'list' ));

        

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

    get filter()
    {
        return (
        {
            parameters: { 1: { type: 132321, selected: [ 31231, 312231 ], values: { id: 3123, label: 'dasdsa' }, 2: [ 312, 23131 ], 3: { from: 12, to: 42342 }}},
        });
    }
}