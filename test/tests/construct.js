'use strict';

const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should construct service instance', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    await server.destroy();
});