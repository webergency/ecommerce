'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create session handle', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let uid = 1, session = shop.session( uid );

    assert.equal( session.constructor.name, 'Session' );
    assert.equal( session.uid, uid );
    assert.equal( session, shop.session( uid ));

    await server.destroy();
});