'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create cart handle', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let id = 1, cart = shop.session( id ).cart;

    assert.equal( cart.constructor.name, 'Cart' );
    assert.equal( cart.id, id );
    assert.equal( cart, shop.session( id ).cart );

    let products = cart.products;

    assert.equal( products.constructor.name, 'CartProducts' );
    assert.equal( products.id, id );
    
    await server.destroy();
});

it( 'should set cart products', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let id = 1, products = shop.session( id ).cart.products, list;

    list = await products.list();

    assert.equal( list.length, 0 );

    await products.set( 1, 2 );
    list = await products.list();

    assert.equal( list.length, 1 );
    assert.equal( list[0].product.constructor.name, 'Product' );
    assert.equal( list[0].product.id, 1 );
    assert.equal( list[0].quantity, 2 );

    await products.set( 1, 3 );
    list = await products.list();

    assert.equal( list.length, 1 );
    assert.equal( list[0].product.id, 1 );
    assert.equal( list[0].quantity, 3 );

    await products.set( 2, 5 );
    list = await products.list();

    assert.equal( list.length, 2 );

    await products.set( 1, 0 );
    list = await products.list();

    assert.equal( list.length, 1 );

    await products.set( 1, 1 );
    list = await products.list();

    assert.equal( list.length, 2 );

    await products.clear();
    list = await products.list();

    assert.equal( list.length, 0 );
    assert.equal( list, await shop.session( id ).cart.products.list() );    

    await server.destroy();
});

it( 'should set cart products by adding/removing quantity', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let id = 1, products = shop.session( id ).cart.products, list;

    list = await products.list();

    assert.equal( list.length, 0 );

    await products.set( 1, '+2' );
    list = await products.list();

    assert.equal( list.length, 1 );
    assert.equal( list[0].quantity, 2 );

    await products.set( 1, '+3' );
    list = await products.list();

    assert.equal( list.length, 1 );
    assert.equal( list[0].quantity, 5 );

    await products.set( 1, '-1' );
    list = await products.list();

    assert.equal( list.length, 1 );
    assert.equal( list[0].quantity, 4 );

    await products.set( 1, '-5' );
    list = await products.list();

    assert.equal( list.length, 0 );

    await products.set( 2, '-5' );
    list = await products.list();

    assert.equal( list.length, 0 );

    await products.set( 2, '5' );
    list = await products.list();

    assert.equal( list.length, 1 );
    assert.equal( list[0].quantity, 5 );

    await products.set( 2, '+1' );
    list = await products.list();

    assert.equal( list.length, 1 );
    assert.equal( list[0].quantity, 6 );

    await products.set( 2, '3' );
    list = await products.list();

    assert.equal( list.length, 1 );
    assert.equal( list[0].quantity, 3 );

    await products.clear();
    list = await products.list();

    assert.equal( list.length, 0 );
    assert.equal( list, await shop.session( id ).cart.products.list() );    

    await server.destroy();
});