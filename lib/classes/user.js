'use strict';

module.exports = class User
{
    #ctx; #data;

    constructor( ctx, uid )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'uid', { value: uid, writable: false, enumerable: true });
    }

    async data()
    {
        return this.#data || ( this.#data = await this.#ctx.client.get( 'session/user', { query: { uid: this.uid }}).then( r => r.json ));
    }

    async orders( filter )
    {

    }

    async claims( filter )
    {
        
    }
}