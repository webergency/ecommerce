'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create cart handle', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let uid = 1, cart = shop.session( uid ).cart;

    assert.equal( cart.constructor.name, 'Cart' );
    assert.equal( cart.uid, uid );
    assert.equal( cart, shop.session( uid ).cart );

    let products = cart.products;

    assert.equal( products.constructor.name, 'CartProducts' );
    assert.equal( products.uid, uid );
    
    await server.destroy();
});

it( 'should set cart products', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let uid = 1, products = shop.session( uid ).cart.products, list;

    list = await products.list();

    assert.equal( list.length, 0 );

    await products.set( 1, 2 );
    list = await products.list();

    assert.equal( list.length, 1 );
    assert.equal( list[0].product.constructor.name, 'Product' );
    assert.equal( list[0].product.uid, 1 );
    assert.equal( list[0].quantity, 2 );

    await products.set( 1, 3 );
    list = await products.list();

    assert.equal( list.length, 1 );
    assert.equal( list[0].product.uid, 1 );
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
    assert.equal( list, await shop.session( uid ).cart.products.list() );    

    await server.destroy();
});