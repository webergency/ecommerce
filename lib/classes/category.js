'use strict';

const Abstract = require('./abstract');

const DEFAULT_SCOPE = 
{
    list    : [ 'name', 'title', 'url', 'image', 'leaf' ],
    detail  : [ 'name', 'title', 'url', 'image', 'leaf', 'description', 'filter', 'seo', 'faq' ]
};

const ORDER =
{
    //'top'       : ( scope ) => ({[ `top._${scope.country}` ]: -1, [ `_id` ]: -1 }),
    'top'       : ( scope ) => ({[ `score.popularity._${scope.country}` ]: -1, [ `_id` ]: -1 }),
    'popular'   : ( scope ) => ({[ `score.popularity._${scope.country}` ]: -1, [ `_id` ]: -1 }),
    'sold'      : ( scope ) => ({[ `score.sales._${scope.country}` ]: -1, [ `score.popularity._${scope.country}` ]: -1, [ `_id` ]: -1 }),
    'review'    : ( scope ) => ({[ `rating.value` ]: -1, [ `rating.count` ]: -1, [ `score.popularity._${scope.country}` ]: -1, [ `_id` ]: -1 }),
    'cheap'     : ( scope ) => ({[ `price.current._${scope.country}` ]: 1, [ `score.popularity._${scope.country}` ]: -1, [ `_id` ]: -1 }),
    'expensive' : ( scope ) => ({[ `price.current._${scope.country}` ]: -1, [ `score.popularity._${scope.country}` ]: -1, [ `_id` ]: -1 }),
    'new'       : ( scope ) => ({[ `__model.created` ]: -1, [ `score.popularity._${scope.country}` ]: -1, [ `_id` ]: -1 }),
    'discount'  : ( scope ) => ({[ `price.discount._${scope.country}` ]: -1, [ `score.popularity._${scope.country}` ]: -1, [ `_id` ]: -1 }),
    'deduction' : ( scope ) => ({[ `price.discount._${scope.country}` ]: -1, [ `score.popularity._${scope.country}` ]: -1, [ `_id` ]: -1 }),
    'a-z'       : ( scope ) => ({[ `name._${scope.locale}` ]: 1, [ `score.popularity._${scope.country}` ]: -1, [ `_id` ]: -1 }),
    'z-a'       : ( scope ) => ({[ `name._${scope.locale}` ]: -1, [ `score.popularity._${scope.country}` ]: -1, [ `_id` ]: -1 })
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
        if( property === 'url' && process.env.DEPLOYMENT )
        {
            [...Object.keys( value )].forEach( k => value[k] = value[k].replace( 'https://','https://' +  process.env.DEPLOYMENT.toLowerCase() + '.' ));
            
            return value;
        }

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
        let start = process.hrtime();

        let query = { filter: {}}, order = filter.order || 'top';

        if( filter.price )
        {
            let { country } = this[Abstract.CTX].ecommerce.scope;
            let [ min, max ] = filter.price.split(':').map( v => v ? parseFloat( v ) : undefined );

            query.filter[`price.current._${country}`] = {};

            ( min !== undefined ) && ( query.filter[`price.current._${country}`].$gte = min );
            ( max !== undefined ) && ( query.filter[`price.current._${country}`].$lte = max );
        }
        
        filter.page && ( query.page = filter.page );
        filter.limit && ( query.limit = filter.limit );
        query.sort = ORDER[ order ]( this[Abstract.CTX].ecommerce.scope );
        
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

        //console.log( require('util').inspect({ filter, query }, { depth: Infinity, colors: true }));

        try
        {
            let { products, page, limit, count } = await this[Abstract.CTX].core.category.products( this.id, query );

            products = await Promise.all( products.map( id => this[Abstract.CTX].ecommerce.product( id, 'list' )));

            products.page = page;
            products.limit = limit;
            products.count = count;
            products.order = order;

            let end = process.hrtime( start );

            console.log( 'products', this.id, query, products.length, ( end[0] * 1e3 + end[1] / 1e6 ).toFixed(2) + 'ms' );

            return products;
        }
        catch(e){ console.log( '*** PRODUCTS PROBLEM ***', e )}
        
    }
}