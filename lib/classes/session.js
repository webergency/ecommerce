'use strict';

const Abstract = require('./abstract');
const Cart = require('./cart');

const randomID = () => ( Date.now() % 90028800000 ) * 100000 + Math.floor( Math.random() * 100000 ); //( 1042 * 24 * 60 * 60 * 1000 )

const DEFAULT_SCOPE = 
{
    list    : [ 'data' ],
    detail  : [ 'data' ],
};

module.exports = class Session extends Abstract
{
    static SCOPE = DEFAULT_SCOPE;

    #cart;

    static get( ctx, id, scope )
    {
        if( !id ){ id = randomID(); scope = undefined }

        let instance = Abstract.get( Session, ctx, id, scope );

        return scope ? instance.then( s => s.__load_cart() ) : instance;
    }

    static [Abstract.LOADER]( core ){ return core.session }

    async __load_cart()
    {
        this.#cart = await Cart.get( this[Abstract.CTX], this.id, 'detail' );

        return this;
    }

    get cart(){ return ( this.#cart || ( this.#cart = Cart.get( this[Abstract.CTX], this.id )))}
}

// VELKE TODO Observable data
// TODO Load cart