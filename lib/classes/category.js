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

    [Abstract.RESOLVER]( property, value )
    {
        switch( property )
        {
            case 'filter' : return Promise.all([...Object.keys( value.parameters )].map( id => this[Abstract.CTX].ecommerce.parameter( parseInt( id ), 'list', value.parameters[id] ))).then( parameters => (( value.parameters = parameters ), value ));
        }
    }

    #sub( type )
    {
        return this[Abstract.CTX].core.category[ type ]( this.id ).then( s => Promise.all( s.map( id => Category.get( this[Abstract.CTX], id, 'list' ))))
    }

    async siblings(){ return this.#properties.siblings || ( this.#properties.siblings = await this.#sub( 'siblings' ))}
    async children(){ return this.#properties.children || ( this.#properties.children = await this.#sub( 'children' ))} 
    async subcategories(){ return this.#properties.subcategories || ( this.#properties.subcategories = await this.#sub( 'subcategories' ))}
    async breadcrumbs(){ return this.#properties.breadcrumbs || ( this.#properties.breadcrumbs = await this.#sub( 'breadcrumbs' ))}

    async products( filter = {})
    {
        let query = { filter: {}};

        filter.page && ( query.page = filter.page );
        filter.limit && ( query.limit = filter.limit );
        filter.order && ( query.order = filter.order );

        if( filter?.parameters )
        {
            for( let parameterID in filter.parameters )
            {
                if( typeof filter.parameters[parameterID] === 'string' )
                {
                    query.filter[`parameters.${parameterID}`] = {};

                    let [ min, max ] = filter.parameters[parameterID].split(':').map( v => v ? parseFloat( v ) : undefined );

                    ( min !== undefined ) && ( query.filter[`parameters.${parameterID}`].$gte = min );
                    ( max !== undefined ) && ( query.filter[`parameters.${parameterID}`].$lte = max );
                }
                else
                {
                    query.filter[`parameters.${parameterID}`] = { $in: filter.parameters[parameterID] };
                }
            }
        }

        try
        {
            let { products, page, limit, count, order } = await this[Abstract.CTX].core.category.products( this.id, query );
            products = await Promise.all( products.map( id => this[Abstract.CTX].ecommerce.product( id, 'list' )));

            products.page = page;
            products.limit = limit;
            products.count = count;
            products.order = order;

            console.log( 'products', this.id, query, products.length );

            return products;
        }
        catch(e){ console.log( '*** PRODUCTS PROBLEM ***', e )}
        
    }

    get url()
    {
        return '/c-c' + this.id; // TODO remove
    }
}