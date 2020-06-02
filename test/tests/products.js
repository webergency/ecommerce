'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create product handle', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let uid = 1, product = shop.product( uid );

    assert.equal( product.constructor.name, 'Product' );
    assert.equal( product.uid, uid );
    assert.equal( product, shop.product( uid ));

    let product_data = await product.data();

    assert.equal( product_data.id, uid );

    await server.destroy();
});

it( 'should fetch similar products', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    let uid = 1, product = shop.product( uid );
    
    let similar =  await product.similar( 10 );

    assert.equal( similar.length, 10 );

    for( let similar_product of similar )
    {
        assert.equal( similar_product.constructor.name, 'Product' );
        assert.equal( typeof similar_product.uid, 'number' );

        let similar_product_data = await similar_product.data();

        assert.equal( similar_product_data.id, similar_product.uid );
    }

    for( let cnt = 0; cnt < 10; ++cnt )
    {
        assert.equal(( await product.similar( cnt )).length, cnt );
    }

    await server.destroy();
});