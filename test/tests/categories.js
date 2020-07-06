'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

const ID = () => parseInt( Math.ceil( Math.random() * Math.floor( 999 / Math.pow( 10, Math.floor( Math.random() * 3 )))).toString().replace(/0/g, () => Math.ceil( Math.random() * 9 )));
const SIBLINGS = ( id ) => new Array(9).fill(0).map(( _, i ) => parseInt( id.toString().slice( 0, -1 ) + ( i + 1 ))).filter( s => s !== id );
const BREADCRUMB = ( id ) => new Array( id.toString().length ).fill(0).map(( _, i ) => parseInt( id.toString().slice( 0, i + 1 )));
const CHILDREN = ( id ) => id.toString().length === 3 ? [] : new Array(9).fill(0).map(( _, i ) => parseInt( id.toString() + ( i + 1 )));

it( 'should create Category handle', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    for( let i = 0; i <= 20; ++i )
    {
        let id = ID(), category = await shop.category( id );

        assert.strictEqual( category.constructor.name, 'Category' );
        assert.strictEqual( category.id, id );
        assert.strictEqual( category, await shop.category( id ));
    }
})
.timeout( 5000 );

it( 'should fetch Category list data', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    for( let i = 0; i <= 20; ++i )
    {
        let id = ID(), category = await shop.category( id, 'list' );

        assert.strictEqual( category.name, `Kategória ${id}` );
        assert.strictEqual( category.description, `Popisok kategórie ${id}` );
        assert.strictEqual( category.title, `Titulok kategórie ${id}` );
        assert.strictEqual( category.url, `/kategoria-${id}-c${id}` );
        assert.strictEqual( category.subcategories, id.toString().length === 3 ? 0 : 9 );
    }
})
.timeout( 5000 );

it( 'should fetch Category siblings', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    for( let i = 0; i <= 20; ++i )
    {
        let id = ID(), category = await shop.category( id );

        let siblings = await category.siblings();

        assert.deepStrictEqual( siblings.map( c => c.id ), SIBLINGS( id ));

        for( let cat of siblings )
        {
            assert.notEqual( cat, category );

            assert.strictEqual( cat.name, `Kategória ${cat.id}` );
            assert.strictEqual( cat.description, `Popisok kategórie ${cat.id}` );
            assert.strictEqual( cat.title, `Titulok kategórie ${cat.id}` );
            assert.strictEqual( cat.url, `/kategoria-${cat.id}-c${cat.id}` );
        }
    }
})
.timeout( 5000 );

it( 'should fetch Category children', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    for( let i = 0; i <= 20; ++i )
    {
        let id = ID(), category = await shop.category( id );

        let children = await category.children();

        assert.deepStrictEqual( children.map( c => c.id ), CHILDREN( id ));

        for( let cat of children )
        {
            assert.strictEqual( cat.name, `Kategória ${cat.id}` );
            assert.strictEqual( cat.description, `Popisok kategórie ${cat.id}` );
            assert.strictEqual( cat.title, `Titulok kategórie ${cat.id}` );
            assert.strictEqual( cat.url, `/kategoria-${cat.id}-c${cat.id}` );
        }
    }
})
.timeout( 5000 );

it( 'should fetch Category breadcrumb', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    for( let i = 0; i <= 20; ++i )
    {
        let id = ID(), category = await shop.category( id );

        let breadcrumb = await category.breadcrumb();

        assert.deepStrictEqual( breadcrumb.map( c => c.id ), BREADCRUMB( id ));
        assert.strictEqual( breadcrumb[ breadcrumb.length - 1 ], category );

        for( let cat of breadcrumb )
        {
            assert.strictEqual( cat.name, `Kategória ${cat.id}` );
            assert.strictEqual( cat.description, `Popisok kategórie ${cat.id}` );
            assert.strictEqual( cat.title, `Titulok kategórie ${cat.id}` );
            assert.strictEqual( cat.url, `/kategoria-${cat.id}-c${cat.id}` );
        }
    }
})
.timeout( 5000 );

it( 'should fetch Category filter', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    let id = 1, category = await shop.category( id );

    let filter = await category.filter();

    assert.deepStrictEqual( filter.price, { min: 0, max: 10974 });
    assert.deepStrictEqual( filter.parameters.map( p => [ p.id, p.values.map( pv => pv.id )]),
    [
        [ 1, [ 1, 2, 3, 4, 5 ]],
        [ 2, [ 6, 7, 8, 9, 10 ]],
        [ 3, [ 11, 12, 13, 14, 15 ]],
        [ 4, [ 16, 17, 18, 19 ]],
        [ 5, [ 20, 21 ]]
    ]);
})
.timeout( 5000 );

it( 'should fetch Category products', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    let id = 1, category = await shop.category( id );

    let products = await category.products();

    assert.strictEqual( products.order, 'top' );
    assert.strictEqual( products.page, 1 );
    assert.deepStrictEqual( products.list.map( p => p.id ), [ 1,11,21,31,41,51,61,71,81,91,101,111,121,131,141,151,161,171,181,191,201,211,221,231,99760,241,251,261,271,281,291,301,311,321,331,341,351,361,371,381,99610,391,401,99590,411,421,99570,431,441,99550,451,461,471,481,491,501,511,521,531,541 ]);
})
.timeout( 15000 );