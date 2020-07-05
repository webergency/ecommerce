'use strict';

const ObjectMerge = require('@liqd-js/alg-object-merge');
const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const ImagesCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Image
{
    #ctx; #data = {};

    static async get( ctx, id )
    {
        let image = ImagesCache.get( ctx ).get( id, () => new Image( ctx, id ));

        /*preload_scope &&*/ await image.load();

        return image;
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

        if( this.#data.width === undefined )
        {
            let image = await this.#ctx.core.call( 'get_image', { id: this.id }, { country, locale });

            ObjectMerge( this.#data,
            {
                url     : image.url,
                width   : image.width,
                height  : image.height,
                count   : image.count,
                status  : image.status
            });
        }
    }

    get url(){ return this.#data.url/*'https://cdn1.webergency.com/meno-produktu-' + this.id + '.jpg'*/}
    get width(){ return this.#data.width }
    get height(){ return this.#data.height }
    get count(){ return this.#data.count }
    get status(){ return this.#data.status }
}