'use strict';

const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const GroupCache = new DefaultWeakMap(() => new DefaultMap());

module.exports = class Group extends Array
{
    static get( ctx, id )
    {
        let instance = GroupCache.get( ctx ).get( id, () => new Group( ctx, id ));

        if( !instance.#loaded )
        {
            if( !instance.#loading )
            {
                instance.#loading = instance.#load();
            }

            return instance.#loading.then(() => instance );
        }

        return instance;
    }

    #ctx; #loaded = false; #loading;

    constructor( ctx, id )
    {
        super();

        this.#ctx = ctx;
        this.id = id;
    }

    async #load()
    {
        //console.log( 'Nacitavam group', this.id );

        let group = await this.#ctx.core.product.group( this.id );
        let products = await Promise.all( group.map( id => this.#ctx.ecommerce.product( id, 'group' )));

        for( let product of products )
        {
            product.__set_group( this );

            this.push( product );
        }

        //TODO kazdemu produktu nasetit 

        this.#loaded = true;
    }

    variations( options = {})
    {
        console.log( 'Jedem na to', this.length );
        
    }
}