const Server = require('@liqd-js/server');

const { ProductFactory } = require('./factory/product');
const { ParameterFactory } = require('./factory/parameter');

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

            res.reply( 'ok' );
        });

        server.listen( port );
    }

    destroy()
    {
        return new Promise( r => this.#server.close( r ));
    }
}