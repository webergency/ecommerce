'use strict';

require('liqd-string')('');
const Abstract = require('./abstract');

const DEFAULT_SCOPE = 
{
    list    : [ 'name', 'title', 'subcategories', 'url' ],
    detail  : [ 'name', 'title', 'subcategories', 'url', 'description', 'filter' ]
};

module.exports = class Category extends Abstract
{
    #properties = {};

    static SCOPE = DEFAULT_SCOPE;

    static get( ctx, id, scope )
    {
        return Abstract.get( Category, ctx, id, scope );
    }

    static [Abstract.LOADER]( core ){ return core.category }

    async #sub( type )
    {
        return Promise.all( await this[Abstract.CTX].core.category[ type ]( this.id ).then( s => s.map( id => Category.get( this[Abstract.CTX], id, 'list' ))))
    }

    async siblings(){ return this.#properties.siblings || ( this.#properties.siblings = await this.#sub( 'siblings' ))}
    async children(){ return this.#properties.children || ( this.#properties.children = await this.#sub( 'children' ))} 
    async subcategories(){ return this.#properties.subcategories || ( this.#properties.subcategories = await this.#sub( 'subcategories' ))}
    async breadcrumbs(){ return this.#properties.breadcrumbs || ( this.#properties.breadcrumbs = await this.#sub( 'breadcrumbs' ))}

    async filter()
    {
        //asi poriesime len ako property
    }

    async products()
    {
        //TODO
    }
}