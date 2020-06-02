'use strict';

module.exports = class User
{
    #ctx; #data;

    constructor( ctx, id )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    async data()
    {
        return this.#data || ( this.#data = await this.#ctx.client.get( 'session/user', { query: { id: this.id }}).then( r => r.json ));
    }

    async orders( filter )
    {

    }

    async claims( filter )
    {
        
    }
}