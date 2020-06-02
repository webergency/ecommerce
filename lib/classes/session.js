'use strict';

const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const Cart = require('./cart');
const User = require('./user');

const SessionsCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Session
{
    #ctx; #cart; #user;

    static get( ctx, id )
    {
        return SessionsCache.get( ctx ).get( id, () => new Session( ctx, id ));
    }

    constructor( ctx, id )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    get cart()
    {
        return this.#cart || ( this.#cart = new Cart( this.#ctx, this.id ));
    }

    get user()
    {
        return this.#user || ( this.#user = new User( this.#ctx, this.id ));
    }
}