'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create Category handle', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'sk' });

    let id = 12, category = await shop.category( id );

    console.log( category );
    console.log( category.name );
    console.log( category.url );

    let children = await category.children();

    console.log({ children });

    for( let child of children )
    {
        console.log( child.name, child.url );
    }

    let breadcrumb = await category.breadcrumb();

    console.log({ breadcrumb });

    for( let node of breadcrumb )
    {
        console.log( node.name, node.url );
    }
    //console.log( await category.children() );

    /*

    assert.equal( category.constructor.name, 'Category' );
    assert.equal( category.id, id );
    assert.equal( category, shop.category( id ) );

    console.log( await category.products() );

    for( let product of await category.products() )
    {
        console.log(( await product.data('list')).name );
    }*/

    await server.destroy();
});