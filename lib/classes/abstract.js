'use strict';

const Clone = require('@liqd-js/clone');
const Multivalue = require('@liqd-js/multivalue');
const ObjectMerge = require('@liqd-js/alg-object-merge');
const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const CTX = Symbol('CTX'), DATA = Symbol('DATA'), RESOLVER = Symbol('RESOLVER');
const LOADER = Symbol('LOADER'), LOADED = Symbol('LOADED'), LOADING = Symbol('LOADING');

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

                if( typeof value === 'function' ){ return value.bind( target )}
                else if( value === undefined )
                {
                    value = target[DATA][property];

                    if ( value && typeof value === 'object' ){ return Multivalue.get( target[DATA], property, target[CTX].multivalueScope(), '_', value => value instanceof Abstract ? value : undefined )}
                }
                
                return value;
            }
        }));

        return scope ? new Promise( resolve => instance.load( scope ).then(() => resolve( instance ))) : instance;
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
        Object.defineProperty( this, LOADING, { value: new Set(), writable: false, enumerable: false });
    }

    async load( scope )
    {
        if( !this.id ){ return }
        if( scope && !Array.isArray( scope )){ scope = this.constructor.SCOPE[ scope ]}
        if( Array.isArray( scope )){ scope = scope.filter( p => !( this[LOADED] === true || this[LOADED].has( p )))};

        if( this[LOADED] !== true && ( scope === undefined || scope.length )) // TODO pocachrovat este s loading
        {
            if( scope === undefined )
            {
                this[LOADED] = true;
            }
            else
            {
                for( let property of scope )
                {
                    this[LOADED].add( property );
                    // TODO add promise to LOADING nech sa nacitava len raz a resolvne spolu
                }
            }

            let data = await this.constructor[LOADER]( this[CTX].core ).get( this.id, scope );

            if( data )
            {
                delete data._id; delete data.id;

                if( this[RESOLVER] )
                {
                    let resolved, async_resolvers = [];

                    for( let property in data )
                    {
                        if(( resolved = this[RESOLVER]( property, data[property] )) !== undefined )
                        {
                            ( resolved instanceof Promise )
                                ? async_resolvers.push( resolved.then( v => data[property] = v )) 
                                : ( data[property] = resolved );
                        }
                    }

                    async_resolvers.length && await Promise.all( async_resolvers );
                }

                ObjectMerge( this[DATA], data );
            }
        }
    }

    toJSON()
    {
        return Multivalue.get( this[DATA], [], this[CTX].multivalueScope(), '_', value => value instanceof Abstract ? { id: value.id } : undefined );
        //return Clone( this[DATA] ); // TODO handler na clone pre entry jak ma JSON stringify
    }

    rawJSON()
    {
        return this[DATA];
        //return Clone( this[DATA] ); // TODO handler na clone pre entry jak ma JSON stringify
    }
}