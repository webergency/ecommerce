'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create product handle', done =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080', locale: 'cz' });

    shop.flow.start( async() =>
    {
        let id = 1, product = shop.product( id );

        assert.equal( product.constructor.name, 'Product' );
        assert.equal( product.id, id );
        assert.equal( product, shop.product( id ));

        let product_data = await product.data();

        assert.equal( product_data.id, id );

        await server.destroy();

        done();
    },
    { locale: 'sk' })
});

it( 'should fetch product list data', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080', locale: 'sk' });

    for( let id = 1; id < 100; ++i )
    {
        let product = shop.product( id );
        let product_data = await product.data( 'list' );

        assert.equal( product_data.id, id );
        assert.equal( product_data.name, name );
    }

    await server.destroy();
});

it( 'should fetch similar products', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080', locale: 'sk' });

    let id = 1, product = shop.product( id );
    
    let similar =  await product.similar( 10 );

    assert.equal( similar.length, 10 );

    for( let similar_product of similar )
    {
        assert.equal( similar_product.constructor.name, 'Product' );
        assert.equal( typeof similar_product.id, 'number' );

        let similar_product_data = await similar_product.data();

        assert.equal( similar_product_data.id, similar_product.id );
    }

    for( let cnt = 0; cnt < 10; ++cnt )
    {
        assert.equal(( await product.similar( cnt )).length, cnt );
    }

    await server.destroy();
});