'use strict';

const Loader = require('../helpers/loader');
const Clone = require('@liqd-js/clone');
const Multivalue = require('@liqd-js/multivalue');
const ObjectMerge = require('@liqd-js/alg-object-merge');
const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const CTX = Symbol('CTX'), DATA = Symbol('DATA'), RESOLVER = Symbol('RESOLVER');
const LOADER = Symbol('LOADER'), LOADED = Symbol('LOADED'), LOADING = Symbol('LOADING');
const NOOP = () => undefined;

const Cache = new DefaultWeakMap(() => new DefaultWeakMap(() => new DefaultMap()));

module.exports = class Abstract
{
    static get( clazz, ctx, id, scope )
    {
        let instance = Cache.get( ctx ).get( clazz ).get( id = parseInt( id ), () => new Proxy( new ( clazz )( ctx, id ),
        {
            get: ( target, property ) =>
            {
                let value = target[property];

                if( typeof value === 'function' ){ value = value.bind( target )}
                else if( value === undefined )
                {
                    value = target[DATA][property];

                    if ( value && typeof value === 'object' ){ return Multivalue.get( target[DATA], property, target[CTX].multivalueScope(), '_', value => value instanceof Abstract ? value : undefined )}
                }
                
                return value;
            }
        }));

        return scope /*&& !instance.__loaded( scope )*/ ? new Promise( resolve => instance.load( scope ).then(() => resolve( instance ))) : instance;
    }

    static get CTX(){ return CTX }
    static get DATA(){ return DATA }
    static get LOADER(){ return LOADER }
    static get RESOLVER(){ return RESOLVER }

    constructor( ctx, id )
    {
        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
        Object.defineProperty( this, CTX, { value: ctx, writable: false, enumerable: false });
        Object.defineProperty( this, DATA, { value: {}, writable: true, enumerable: false });
        Object.defineProperty( this, LOADED, { value: new Set(), writable: true, enumerable: false });
        Object.defineProperty( this, LOADING, { value: new Map(), writable: false, enumerable: false });
    }

    __loaded( scope )
    {
        if( !this.id ){ return true }
        if( scope && !Array.isArray( scope )){ scope = this.constructor.SCOPE[ scope ]}
        if( Array.isArray( scope )){ scope = scope.filter( p => !( this[LOADED] === true || this[LOADED].has( p )))};

        return ( scope !== undefined && scope.length === 0 );
    }

    async load( scope )
    {
        //console.log( this.constructor.name, this.id );

        if( !this.id ){ return }
        if( scope && !Array.isArray( scope )){ scope = this.constructor.SCOPE[ scope ]}
        if( Array.isArray( scope )){ scope = scope.filter( p => !( this[LOADED] === true || this[LOADED].has( p )))};

        if( this.constructor.name === 'Product', this.id === 7543 )
        {
            //console.log( 'PRELOADING', this.constructor.name, this.id, { scope });
        }

        if( this[LOADED] !== true && ( scope === undefined || scope.length )) // TODO pocachrovat este s loading
        {
            let start = process.hrtime();

            if( this.constructor.name === 'Cart' )
            {
                //console.log( 'LOAD', this.constructor.name, this.id, scope );
            }

            let loaders = [];
            
            if( scope ) // TODO all loader
            {
                loaders = scope.map( p => this[LOADING].get( p )).filter( Boolean );
                scope = scope.filter( p => !this[LOADING].has( p ));
            }

            if( this.constructor.name === 'Product', this.id === 7543 )
            {
                //console.log( 'LOADING', this.constructor.name, this.id, scope );
            }

            if( scope === undefined || scope.length )
            {
                const scope_loaders = new Map( scope.map( p => [ p, new Loader(() => { /*if( this.constructor.name === 'Product' && this.id === 7543 ){ console.log('loaded', p) }*/ ( this[LOADED] !== true ) && this[LOADED].add( p )}, NOOP, () => this[LOADING].delete( p ))]));

                // TODO pridat timed promise

                /*let timeouted = setTimeout(() =>
                {
                    console.log( 'LOADING problem', this.constructor.name, this.id );
                },
                3000 );*/

                scope.forEach( p => this[LOADING].set( p, scope_loaders.get( p ).promise ));
                
                try
                {
                    /* TODO
                    if( scope === undefined )
                    {
                        this[LOADED] = true;
                    }*/

                    if( this.constructor.name === 'Cart' )
                    {
                        //console.log( 'GET', this.constructor.name, this.id, scope );
                    }

                    let data = await this.constructor[LOADER]( this[CTX].core ).get( this.id, scope ).catch( e => null ); // TODO handlovat podla kodu chyby

                    if( this.constructor.name === 'Product' && this.id === 7543 )
                    {
                        //console.log( 'GET', this.constructor.name, this.id, data );
                    }
                    //console.log( 'DATA', this.constructor.name, this.id, data );

                    if( data )
                    {
                        delete data._id; delete data.id;

                        let resolved, loader, async_resolvers = [];

                        for( let [ property, value ] of Object.entries( data ))
                        {
                            if( this[RESOLVER] )
                            {
                                if(( resolved = this[RESOLVER]( property, data[property] )) !== undefined )
                                {
                                    if( resolved instanceof Promise )
                                    {
                                        async_resolvers.push( resolved.then( value => 
                                        {
                                            ObjectMerge( this[DATA], {[ property ]: value });

                                            ( loader = scope_loaders.get( property )) && loader.loaded();
                                        }));

                                        continue;
                                    }

                                    value = resolved;
                                }
                            }

                            ObjectMerge( this[DATA], {[ property ]: value });

                            ( loader = scope_loaders.get( property )) && loader.loaded();
                        }

                        for( let [ property, loader ] of scope_loaders.entries() )
                        {
                            if( !data.hasOwnProperty( property ))
                            {
                                loader.loaded();
                            }
                        }

                        async_resolvers.length && await Promise.all( async_resolvers );
                    }
                    else
                    {
                        for( let [ property, loader ] of scope_loaders.entries() )
                        {
                            if( !data || !data.hasOwnProperty( property ))
                            {
                                loader.loaded();
                            }
                        }
                    }
                }
                catch( e )
                {
                    for( let loader of scope_loaders.values() )
                    {
                        loader.failed();
                    }

                    throw e;
                }

                //clearTimeout( timeouted );
            }

            loaders.length && await Promise.all( loaders );

            if( this.constructor.name === 'Product' )
            {
                //console.log( 'POLOADENO', this.constructor.name, this.id, scope );
            }

            let end = process.hrtime( start );

            //console.log( 'LOAD', this.constructor.name, this.id, scope, ( end[0] * 1e3 + end[1] / 1e6 ).toFixed(2) + 'ms' );
        }

        if( this.constructor.name === 'Product' )
        {
            //console.log( 'MAM', this.constructor.name, this.id, scope );
        }

        if( this.constructor.name === 'Product', this.id === 7543 )
        {
            console.log( 'LOADED', this.constructor.name, this.id, { scope })
        }
    }

    toJSON()
    {
        return { id: this.id, ...Multivalue.get( this[DATA], [], this[CTX].multivalueScope(), '_', value => value instanceof Abstract ? { id: value.id } : undefined )};
        //return Clone( this[DATA] ); // TODO handler na clone pre entry jak ma JSON stringify
    }

    rawJSON()
    {
        return this[DATA];
        //return Clone( this[DATA] ); // TODO handler na clone pre entry jak ma JSON stringify
    }
}