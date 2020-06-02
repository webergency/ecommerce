'use strict';

const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const Cart = require('./cart');
const User = require('./user');

const SessionsCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Session
{
    #ctx; #cart; #user;

    static get( ctx, uid )
    {
        return SessionsCache.get( ctx ).get( uid, () => new Session( ctx, uid ));
    }

    constructor( ctx, uid )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'uid', { value: uid, writable: false, enumerable: true });
    }

    get cart()
    {
        return this.#cart || ( this.#cart = new Cart( this.#ctx, this.uid ));
    }

    get user()
    {
        return this.#user || ( this.#user = new User( this.#ctx, this.uid ));
    }
}