'use strict';

const { Observable, Observer } = require('@liqd-js/observable');
const Abstract = require('./abstract');
const Cart = require('./cart');

const NOOP = () => undefined;
const randomID = () => ( Date.now() % 90028800000 ) * 100000 + Math.floor( Math.random() * 100000 ); //( 1042 * 24 * 60 * 60 * 1000 )

const DEFAULT_SCOPE = 
{
    list    : [ 'data' ],
    detail  : [ 'data' ],
};

module.exports = class Session extends Abstract
{
    static SCOPE = DEFAULT_SCOPE;

    #cart; #data; #observer;

    static get( ctx, id, scope )
    {
        if( !id ){ id = randomID(); scope = undefined }

        let instance = Abstract.get( Session, ctx, id, scope );

        return scope ? instance.then( s => s.__load() ) : instance;
    }

    static [Abstract.LOADER]( core ){ return core.session }

    [Abstract.RESOLVER]( property, value )
    {
        switch( property )
        {
            case 'data': return ( this.#set_data( value ), undefined );
        }
    }

    constructor( ctx, id )
    {
        super( ctx, id );

        this.#set_data();
    }

    #set_data( data = {})
    {
        this.#data = Observable( data );
        this.#observer = new Observer();
        this.#observer.observe( this.#data );

        this.#observer.on( 'add', () => this.#sync());
        this.#observer.on( 'update', () => this.#sync());
    }

    async __load()
    {
        this.#cart = await Cart.get( this[Abstract.CTX], this.id, 'detail' );

        return this;
    }

    async #sync()
    {
        // TODO timer ci uz cez observable alebo az tu

        //console.log( 'Syncing session ' + this.id, this.#data );

        return this[Abstract.CTX].core.session.update( this.id, { $set: { data: this.#data }}, { upsert: true }).catch( NOOP );
    }

    get data(){ return this.#data }
    get cart(){ return ( this.#cart || ( this.#cart = Cart.get( this[Abstract.CTX], this.id )))}
}
