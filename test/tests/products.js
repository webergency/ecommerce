'use strict';

const assert = require('assert');
const Ecommerce = require('../../lib/ecommerce');

const ID = () => Math.ceil( Math.random() * 100000 );

it( 'should create Product handle', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk' });

    for( let i = 0; i <= 20; ++i )
    {
        let id = ID(), product = await shop.product( id );

        assert.equal( product.constructor.name, 'Product' );
        assert.equal( product.id, id );
        assert.equal( product, await shop.product( id ));
    }
})
.timeout( 5000 );

it( 'should fetch Product list data', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    for( let i = 0; i <= 10; ++i )
    {
        let id = ID(), product = await shop.product( id, 'list' );

        assert.strictEqual( product.name, `Produkt ${id} zo skupiny ${Math.floor((id-1)/10)+1}` );
        
        assert.ok( typeof product.price.current === 'number' && product.price.current > 0 );
        assert.ok( Array.isArray( product.images ));

        console.log( product.parameters );


        /*
        name        : { [locale]: product.name },
                    price       : { [country]: product.price },
                    images      : await Promise.all( product.images.map( id => Image.get( this.#ctx, id ))),
                    parameters  : product.parameters,
                    tags        : product.tags,
                    shipping    : product.shipping,
                    availability: { [country]: product.availability },
                    timings     : { [country]: product.timings }
        /*assert.strictEqual( category.description, `Popisok kategórie ${id}` );
        assert.strictEqual( category.title, `Titulok kategórie ${id}` );
        assert.strictEqual( category.url, `/kategoria-${id}-c${id}` );
        assert.strictEqual( category.subcategories, id.toString().length === 3 ? 0 : 9 );*/
    }
})
.timeout( 15000 );



/*

it( 'should fetch product list data', async() =>
{
    let locale = 'sk';

    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080', locale });

    for( let id = 1; id < 100; ++id )
    {
        let product = shop.product( id );
        let product_data = await product.data( 'list' );

        assert.equal( product_data.id, id );
        assert.equal( product_data.name, ( locale + ' Product ' + id ) );
        assert.deepStrictEqual( product_data.price,
        {
            current : id * 2.20,
            average : id * 3,
            discount: id / 10
        });
        assert.deepStrictEqual( product_data.images, images( id, 10, locale ) );
        assert.deepStrictEqual( product_data.parameters, parameters( id, 5, 10 ) );
        assert.deepStrictEqual( product_data.tags, randomIDs( id, 5 ) );

        //console.log(product_data)
    }

    await server.destroy();
});

it( 'should fetch product group data', async() =>
{
    let locale = 'sk';

    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080', locale });

    for( let id = 1; id < 100; ++id )
    {
        let product = shop.product( id );
        let product_data = await product.data( 'group' );

        assert.equal( product_data.id, id );
        assert.deepStrictEqual( product_data.group,
        {
            id: id * 10000,
            name: 'Product group ' + id,
            variants: randomIDs( id, 10 ),
            price:
            {
                min     : parseFloat(( id * 1000 ).toFixed(2)),
                max     : parseFloat(( id * 5000 ).toFixed(2))
            }
        });
    }

    await server.destroy();
});

it( 'should fetch product detail data', async() =>
{
    let locale = 'sk';

    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080', locale });

    for( let id = 1; id < 100; ++id )
    {
        let product = shop.product( id );
        let product_data = await product.data( 'detail' );

        assert.equal( product_data.description, locale + ' Description of the product ' + id );
        assert.deepStrictEqual( product_data.seo,
        {
            title       : locale + ' Seo title of the product ' + id,
            description : locale + ' Seo description of the product ' + id
        });
        assert.deepStrictEqual( product_data.identifiers,
        {
            gtin8   : 'gtin8 ' + id,
            gtin13  : 'gtin13 ' + id,
            gtin14  : 'gtin14 ' + id,
            mpn     : 'mpn ' + id,
            isbn    : 'isbn ' + id
        });
        assert.deepStrictEqual( product_data.shipping,
        {
            width   : id * 2,
            height  : id * 3,
            depth   : id * 4,
            weight  : id * 5
        });
        assert.equal( product_data.brand, 'Brand ' + id );
        assert.deepStrictEqual( product_data.availability,
        {
            status  : '',
            min     : id,
            max     : id * 2,
            step    : 1,
            stock   : id * 2
        });
        assert.deepStrictEqual( product_data.timings, { dispatch: 7, delivery: 2 });
        assert.deepStrictEqual( product_data.rating,
        {
            value   : 4.9,
            count   : 300,
            max     : 5,
            reviews:
            [
                {
                    author:
                        {
                            name: ''
                        },
                    rating  : 1,
                    body    : ''
                }
            ]
        });
        assert.deepStrictEqual( product_data.galleries, [ { uid : 'main', images : images( id, 10, locale )}]);
        assert.deepStrictEqual( product_data.related, randomIDs( id, 5 ));


        //console.log(product_data)
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
*/