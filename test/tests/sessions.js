'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create session handle', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let id = 1, session = shop.session( id );

    assert.equal( session.constructor.name, 'Session' );
    assert.equal( session.id, id );
    assert.equal( session, shop.session( id ));

    await server.destroy();
});