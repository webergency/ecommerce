'use strict';

const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const CategoriesCache = new DefaultWeakMap(() => new DefaultMap());

const Category = module.exports = class Category
{
    #ctx; #uid;

    static get( ctx, uid )
    {
        return CategoriesCache.get( ctx ).get( uid, () => new Category( ctx, uid ));
    }

    constructor( ctx, uid )
    {
        this.#ctx = ctx;
        this.#uid = uid;
    }

    get uid(){ return this.#uid }

    products( filter )
    {
        filter = 
        {
            query: 'textova query',
            parameters: { 1: 3123, 2: [ 312, 23131 ], 3: { from: 12, to: 42342 }},
            sort: 'sdasda',
            limit: 30,
            page: 2 // after: 31231 // id produktu
        }
    }

    get filter()
    {
        return (
        {
            parameters: { 1: { type: 132321, selected: [ 31231, 312231 ], values: { id: 3123, label: 'dasdsa' }, 2: [ 312, 23131 ], 3: { from: 12, to: 42342 }}},
        });
    }
}