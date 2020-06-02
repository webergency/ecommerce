'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create user handle', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let uid = 1, user = shop.session( uid ).user;

    assert.equal( user.constructor.name, 'User' );
    assert.equal( user, shop.session( uid ).user );

    await server.destroy();
});