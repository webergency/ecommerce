'use strict';

const Image = require('./image');

const ObjectMerge = require('@liqd-js/alg-object-merge');
const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const GalleriesCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Gallery
{
    #ctx; #data = {};

    static async get( ctx, id )
    {
        let gallery = GalleriesCache.get( ctx ).get( id, () => new Gallery( ctx, id ));

        /*preload_scope &&*/ await gallery.load();

        return gallery;
    }

    constructor( ctx, id )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    _scope()
    {
        return { country: this.#ctx.flow.get('country') || this.#ctx.country, locale: this.#ctx.flow.get('locale') || this.#ctx.locale }
    }

    async load()
    {
        const { country, locale } = this._scope();

        if( this.#data.images === undefined )
        {
            let gallery = await this.#ctx.core.call( 'get_gallery', { id: this.id }, { country, locale });

            ObjectMerge( this.#data,
            {
                images: await Promise.all( gallery.images.map( id => Image.get( this.#ctx, id ))),
            });
        }
    }

    get images(){ return this.#data.images }
}