'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create Category handle', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let uid = 1, category = shop.category( uid );

    assert.equal( category.constructor.name, 'Category' );
    assert.equal( category.uid, uid );
    assert.equal( category, shop.category( uid ) );

    await server.destroy();
});