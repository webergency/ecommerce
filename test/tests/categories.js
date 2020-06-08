'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create Category handle', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let id = 1, category = shop.category( id );

    assert.equal( category.constructor.name, 'Category' );
    assert.equal( category.id, id );
    assert.equal( category, shop.category( id ) );

    console.log( await category.products() );

    for( let product of await category.products() )
    {
        console.log(( await product.data('list')).name );
    }

    await server.destroy();
});