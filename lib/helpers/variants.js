'use strict';

const { DefaultMap } = require('./default_containers');

function get_parameter_values_sequence( parameter )
{
    return parameter ? Math.min( ...parameter.values.map( p => typeof p === 'number' ? p : p.sequence )) : 0;
}

function get_parameter_values_label( parameter )
{
    // TODO .slice.sort( by sequence )

    return parameter ? parameter.values.map( p => typeof p === 'number' ? p : p.label ).join(', ') : '';
}

function get_parameter_values_hash( parameter )
{
    return parameter ? parameter.values.map( p => typeof p === 'number' ? p : p.id ).sort().join('|') : '';
}

function get_product_parameter( product, parameter )
{
    return product.parameters.find( p => p.id === parameter.id );
}

function get_products_distance( product1, product2, parameters )
{
    let distance = 0;

    for( let parameter of parameters )
    {
        if( get_parameter_values_hash( get_product_parameter( product1, parameter )) !== get_parameter_values_hash( get_product_parameter( product2, parameter )))
        {
           distance += Math.max( parameter.priority || 0, 0.1 );
        }
    }

    return distance;
}

function is_parameter_correlated( products, parameter, correlated_parameter ) // rozne nastavenia - korelacia len cez poslednu grupu, cez vsetky produkty
{
    if( parameter.priority !== correlated_parameter.priority ){ return false }
    if( parameter.unit !== correlated_parameter.unit ){ return false }

    const index = new Map();

    for( let product of products )
    {
        let parameter_hash = get_parameter_values_hash( get_product_parameter( product, parameter )), correlated_parameter_hash = get_parameter_values_hash( get_product_parameter( product, correlated_parameter ));

        if( !index.has( parameter_hash ))
        {
            index.set( parameter_hash, correlated_parameter_hash );
        }
        else if( index.get( parameter_hash ) !== correlated_parameter_hash )
        {
            return false;
        }
    }
    
    return true;
}

function is_parameter_distinct( parameter, distinct_groups )
{
    let is_distinct = false;

    for( let i = 0; i < distinct_groups.length; ++i )
    {
        let parameter_distinct_group = new DefaultMap(() => []);

        for( let product of distinct_groups[i] )
        {
            parameter_distinct_group.get( get_parameter_values_hash( get_product_parameter( product, parameter ))).push( product );
        }

        if( parameter_distinct_group.size > 1 )
        {
            distinct_groups.splice( i, 1, ...parameter_distinct_group.values() );

            i += parameter_distinct_group.size - 1; // TODO overit
            is_distinct = true;
        }
    }

    return is_distinct;
}

function get_distinct_parameters( products )
{
    let parameters = new DefaultMap();

    for( let product of products )
    {
        for( let parameter of product.parameters )
        {
            for( let value of parameter.values )
            {
                parameters.get( parameter.id, () => ({ ...parameter.toJSON(), values: new Set() })).values.add( value );
            }
        }
    }

    let distinct_parameters = [...parameters.values()]
        .filter( p => p.values.size > 1 )
        .sort(( a, b ) => a.priority !== b.priority ? b.priority - a.priority : ( a.sequence !== b.sequence ? a.sequence - b.sequence : a.id - b.id ));

    let distinct_groups = [ products ];

    for( let i = 0; i < distinct_parameters.length; ++i )
    {
        if( !is_parameter_distinct( distinct_parameters[i], distinct_groups ))
        {
            distinct_parameters.splice( i--, 1 );
        }
        else
        {
            if( !distinct_groups.find( g => g.length > 1 ))
            {
                if( false ) // correlated
                {
                    for( let j = i + 1; j < distinct_parameters.length; ++j )
                    {
                        if( !is_parameter_correlated( products, distinct_parameters[i], distinct_parameters[j] ))
                        {
                            distinct_parameters.splice( j--, 1 );
                        }
                    }
                }
                else
                {   
                    distinct_parameters.splice( i + 1 );
                }

                break;
            }
        }
    }

    return distinct_parameters;
}

function create_variation( products, parameter )
{
    let values = new Map();

    for( let product of products )
    {
         // TODO ochrany ked nebude mat
        let product_parameter = get_product_parameter( product, parameter ), values_hash = get_parameter_values_hash( product_parameter );

        let value = values.get( values_hash );

        if( !value )
        {
            values.set( values_hash, value = 
            {
                id      : values_hash,
                label   : get_parameter_values_label( product_parameter ), 
                sequence: get_parameter_values_sequence( product_parameter ),
                products: []
            });
        }

        value.products.push( product );
    }

    return (
    {
        ...parameter,
        id      : parameter.id.toString(),
        values  : [...values.values()].sort(( a, b ) => a.sequence !== b.sequence ? a.sequence - b.sequence : ( a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1 ))
    });
}

module.exports = function variants( group, options = {})
{
    let start = process.hrtime();

    if( group.length < 2 ){ return }

    let products = group.filter( p => true ); // todo podla options dat len dostupne alebo podobne
    let distinct_parameters = get_distinct_parameters( products );
    let variations = distinct_parameters.map( p => create_variation( products, p, distinct_parameters ));

    if( options.product )
    {
        for( let variation of variations )
        {
            for( let value of variation.values )
            {
                value.products.sort(( a, b ) => get_products_distance( options.product, a, distinct_parameters ) - get_products_distance( options.product, b, distinct_parameters ));

                console.log( value.products.map( p => p.name ) );

                if( value.products[0] === options.product )
                {
                    value.selected = true;
                }
            }
        }
    }

    let end = process.hrtime(  start);

    console.log( 'VARIANTS TOOK', ( end[0] * 1e3 + end[1] / 1e6 ).toFixed(2) + 'ms' );  

    return { variations, products };
}