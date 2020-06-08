'use strict';

const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const ParametersCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Parameter
{
    #ctx; #data;

    static get( ctx, id )
    {
        return ParametersCache.get( ctx ).get( id, () => new Parameter( ctx, id ));
    }

    constructor( ctx, id )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    async data()
    {
        return this.#data || ( this.#data = await this.#ctx.client.get( 'parameter', { query: { id: this.id, locale: this.#ctx.flow.get('locale') || this.#ctx.locale }}).then( r => r.json ));
    }


    async values()
    {
        return await this.#ctx.client.get( 'parameter/values', { query: { id: this.id, locale: this.#ctx.flow.get('locale') || this.#ctx.locale }}).then( r => r.json );
    }
}