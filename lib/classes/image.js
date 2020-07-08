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

        await image.load();

        return image;
    }

    constructor( ctx, id )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    async load()
    {
        if( this.#data.width === undefined )
        {
            let image = await this.#ctx.core2.image.get( this.id );

            ObjectMerge( this.#data,
            {
                url     : image.url,
                seoURL  : image.seoURL,
                width   : image.width,
                height  : image.height,
                count   : image.count,
                status  : image.status
            });
        }
    }

    // TODO seoURL - pozriet na akom som produkte a tak mi dat name - vzdy niekomu patrim - poslat do ctx instanciu a property ktoru citat aby sli aj lokalizacie

    get url(){ return this.#data.url/*'https://cdn1.webergency.com/meno-produktu-' + this.id + '.jpg'*/}
    get width(){ return this.#data.width }
    get height(){ return this.#data.height }
    get count(){ return this.#data.count }
    get status(){ return this.#data.status }

    get seoURL( scope )
    {
        if( !this.#data.seoURL ){ return this.url }

        return ( new Function( 's', 'for( let v in s ){ this[v] = s[v] } return `' + this.#data.seoURL + '`' ))({ ...this.#ctx.scope(), ...scope })
    }
}