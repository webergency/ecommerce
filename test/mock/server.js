const Server = require('@liqd-js/server');

function randomIDs( id, count )
{
    let ids = [];

    for( let start = Math.floor( ( id - 1 ) / count ) * count + 1, i = start; i < start + count; ++i )
    {
        ids.push( i );
    }

    return ids;
}

function parameters( id, labelCount, valueCount )
{
    let parameters = {};

    for( let i = 0; i < labelCount; ++i )
    {
        parameters[ i + id ] = [...Array(valueCount).keys()].map( x => x + id )
    }

    return parameters;
}

function images( id, count, locale )
{
    let images = [];

    for( let i = 0; i < count; ++i )
    {
       images.push(
       {
           id      : ( id * i ),
           url     : 'https://cdn.hk-green.'+locale+'/_'+id+'-'+( id * i )+'.jpg', //SPARSOVANA NA TVOJE CDN
           width   : id * 15,
           height  : id * 10,
           count   : i,
           caption : locale + ' image caption ' + ( id * i )
       })
    }

    return images;
}

function ProductFactory( id, locale, type = 'list' )
{
    id = parseInt( id );

    if( type === 'list' )
    {
        return (
        {
            id,
            name: locale + ' Product ' + id, // SINGLE PRODUCT NAME
            group:
            {
                id     : id * 10000,
                name   : 'Product group ' + id // NAME FOR GROUP( split zo seckych a spolocne stringy )
            },
            variants: randomIDs( id, 10 ), //GROPU PRODUCTS
            price:
            {
                current : id * 2.20,
                average : id * 3,
                discount: id / 10,
                min     : parseFloat(( id * 1000 ).toFixed(2)),
                max     : parseFloat(( id * 5000 ).toFixed(2))
            },
            images: images( id, 10, locale ),
            parameters: parameters( id, 5, 10 ),
            tags: randomIDs( id, 5 )
        });
    }
    else
    {
        return (
        {
            description: locale + ' Description of the product ' + id,
            seo:
            {
                title       : locale + ' Seo title of the product ' + id,
                description : locale + ' Seo description of the product ' + id,
            },
            identifiers:
            {
                gtin8   : 'gtin8 ' + id,
                gtin13  : 'gtin13 ' + id,
                gtin14  : 'gtin14 ' + id,
                mpn     : 'mpn ' + id,
                isbn    : 'isbn ' + id
            },
            shipping:
            {
                width   : id * 2,
                height  : id * 3,
                depth   : id * 4,
                weight  : id * 5
            },
            brand: 'Brand ' + id,
            availability:
            {
                status  : '',
                min     : id, //MINIMUM BUY COUNT
                max     : id * 2, //MAXIMUM BUY COUNT
                step    : 1, //STEP COUNTS
                stock   : id * 2 //AVAILABLE IN STOCK
            },
            timings:
            {
                dispatch: 7, //DISPATCHING TIME
                delivery: 2 //DELIVERING TIME
            },
            rating: //TODO POROB SERVIS
            {
                value   : 4.9, //AVERAGE VALUE OF REVIEWS
                count   : 300, //TOTAL COUNT OF REVIEWS
                max     : 5, //MAXIMUM RATING VALUE
                reviews:
                [
                    {
                        author:
                        {
                            name: '' //AUTHOR OF RATING( TODO MORE PROPERTIES )
                        },
                        rating  : 1, //RATING VALUE
                        body    : '' //MESSAGE
                    }
                ]
            },
            galleries:
            [
                {
                    uid     : 'main',
                    images  : images( id, 10, locale )
                }
            ],
            related: randomIDs( id, 5 )
        });
    }
}

function ParameterFactory( uid )
{
    let id = parseInt( uid );

    return (
    {
        id,
        label: 'Parameter ' + id,
        type: '',
        description: 'Description of the product ' + id,
        price: parseFloat(( Math.random() * 1000 ).toFixed(2))
    });
}

module.exports = class MockServer
{
    #server;

    constructor( port )
    {
        const server = this.#server = new Server();

        /*server.use(( req, res, next ) =>
        {
            console.log( req.path );

            next();
        });*/

        server.get( '/product', ( req, res, next ) =>
        {
            let product = ProductFactory( req.query.id, req.query.locale, req.query.scope );

            res.reply( product );
        });

        server.get( '/products/similar', ( req, res, next ) =>
        {
            let similar = [];

            for( let i = 0, count = parseInt( req.query.count ); i < count; ++i )
            {
                similar.push( Math.ceil( Math.random() * 1000 ));
            }

            res.reply( similar );
        });

        server.put( '/session/:id/cart/products', async( req, res, next ) =>
        {
            let body = await req.body;

            console.log( req.params, body );

            res.reply( 'ok' );
        });

        server.listen( port );
    }

    destroy()
    {
        return new Promise( r => this.#server.close( r ));
    }
}