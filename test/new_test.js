'use strict';

const MongoClient = require('../../ecommerce-core/node_modules/mongodb').MongoClient;
const EcommerceCore = require('../../ecommerce-core/lib/ecommerce');
const Ecommerce = require('../lib/ecommerce');

async function test()
{
    const mongo = MongoClient( `mongodb://localhost:27017`, { useUnifiedTopology: true }); await mongo.connect();
    const db = mongo.db( 'webergency_ecommerce_eshop_123' );

    const core = new EcommerceCore({ db });
    const ecommerce = new Ecommerce({ company: {}, core, locale: 'cs', country: 'SK' });
    
    let category = ecommerce.category( 2 );

    await category.load( 'list' );

    //console.log( category.toJSON() );

    //console.log( category.description );

    //console.log(( await category.siblings() ).map( c => c.name ));
    //console.log(( await category.siblings() ).map( c => c.name ));

    let category2 = await ecommerce.category( 2, 'detail' );

    console.log('----------')

    //console.log( category.toJSON() );

    console.log( category === category2 );

    let gallery = ecommerce.gallery( 18 );

    await gallery.load( 'list' );
    await gallery.load( 'detail' );

    console.log( gallery );
    console.log( gallery.images );

    let product = ecommerce.product( 657 );

    await product.load('detail');

    console.log( product.name );
    //console.log( product.toJSON() );
    //console.log( product.rawJSON() );
    //console.log( 'Images', product.images );
    //console.log( 'Image', product.images[0] );
    //console.log( 'Raw', product.images[0].rawJSON() );
    //console.log( 'URL', product.images[0].url );

    let session = await ecommerce.session( 2239299305239733, 'list' );

    await ecommerce.session( 2239299305239733, 'list' );

    console.log( 'session', session.rawJSON() );

    let new_session = await ecommerce.session( null, 'list' );

    console.log( 'new_session', new_session.id, new_session.rawJSON() );
}

test();