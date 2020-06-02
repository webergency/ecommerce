'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const Ecommerce = require('../../lib/ecommerce');

it( 'should perfom well', async() =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080' });

    await shop.product( 0 ).data();

    let render = '', start = process.hrtime();

    let product = shop.product( 1 );
    let product_data = await product.data();

    render += `Product: ${ product_data.name } at ${ product_data.price }`;

    let similar_products =  await product.similar( 20 );
    let similar_product_dataset = await Promise.all( similar_products.map( p => p.data() ));


    for( let similar_product_data of similar_product_dataset )
    {
        render += `\nSimilar product: ${ similar_product_data.name } for ${ similar_product_data.price }`;
    }

    let end = process.hrtime(start);

    console.log( render, '\n\n----\n\nRender perfomance: ' + ( end[0] * 1e3 + end[1] / 1e6 ).toFixed(2) + 'ms\n' );

    start = process.hrtime();

    product_data = await product.data();

    render = `Product: ${ product_data.name } at ${ product_data.price }`;

    similar_product_dataset = await Promise.all( similar_products.map( p => p.data() ));

    for( let similar_product_data of similar_product_dataset )
    {
        render += `\nSimilar product: ${ similar_product_data.name } for ${ similar_product_data.price }`;
    }

    end = process.hrtime(start);

    console.log( render, '\n\n----\n\nRender perfomance: ' + ( end[0] * 1e3 + end[1] / 1e6 ).toFixed(2) + 'ms\n' );

    await server.destroy();
});