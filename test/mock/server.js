const Server = require('@liqd-js/server');

function ProductFactory( id, locale )
{
    id = parseInt( id );

    return (
    {
        id,
        name: 'Product ' + id,
        description: 'Description of the product ' + id,
        price: parseFloat(( Math.random() * 1000 ).toFixed(2))
    });
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
            let product = ProductFactory( req.query.id );

            res.reply({ id: product.id });
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