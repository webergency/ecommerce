'use strict';

const { Observable, Observer } = require('@liqd-js/observable');
const ObjectMerge = require('@liqd-js/alg-object-merge');
const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const Cart = require('./cart');
const User = require('./user');

const SessionsCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Session
{
    #ctx; #cart; #user; #data; #data_observer;

    static async get( ctx, id )
    {
        let new_session = ( id === undefined );

        if( id === undefined ){ id = Math.floor( Math.random() * Number.MAX_SAFE_INTEGER )}

        if( id === 0 ){ return new Session( ctx, id )}

        let preload = false;

        let session = SessionsCache.get( ctx ).get( id, () => ( preload = true, new Session( ctx, id )));

        !new_session && preload && await session.load();

        return session;
    }

    constructor( ctx, id )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });

        this.#data = Observable({});
        this.#data_observer = new Observer();
        this.#data_observer.observe( this.#data );

        this.#data_observer.on( 'add', ( path ) => this._sync());
        this.#data_observer.on( 'update', ( path ) => this._sync());

        this.#cart = new Cart( this.#ctx, this.id );
    }

    async _sync()
    {
        this.id && await this.#ctx.client.put( 'session/' + this.id + '/data', { body: this.#data }).then( r => r.text );
    }

    async load( scope = 'full' )
    {
        let data = await this.#ctx.client.get( 'session/' + this.id + '/data' ).then( r => r.json );

        if( data )
        {
            ObjectMerge( this.#data, data );

            await this.#cart._load();
        }
    }

    get cart()
    {
        return this.#cart;
    }

    get user()
    {
        return this.#user || ( this.#user = new User( this.#ctx, this.id ));
    }

    get data()
    {
        return this.#data;
    }
}