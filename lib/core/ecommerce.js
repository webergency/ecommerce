'use strict';

const Client = require('@liqd-js/client');
const ObjectHash = require('../helpers/object_hash');

const ARR = arr => Array.isArray( arr ) ? arr : [ arr ];
//const ARRATTR = ( attr, value ) => Array.isArray( value )

const API = 
{
    'get_category' :
    {
        method      : 'get',
        url         : 'category',
        query       : [ 'id', 'scope' ],
        aggregate   : [ 'id', [ 'scope' ]]
    },
    'get_products/group' :
    {
        method      : 'get',
        url         : 'products/group',
        query       : [ 'id' ],
        //aggregate   : [ 'id', []]
    },
    'get_product' :
    {
        method      : 'get',
        url         : 'product',
        query       : [ 'id', 'scope' ],
        aggregate   : [ 'id', [ 'scope' ]]
    },
    'get_parameter' :
    {
        method      : 'get',
        url         : 'parameter',
        query       : [ 'id' ],
        aggregate   : [ 'id', []]
    },
    'get_parameter/value' :
    {
        method      : 'get',
        url         : 'parameter/value',
        query       : [ 'id' ],
        aggregate   : [ 'id', []]
    }
}

module.exports = class EcommerceCore
{
    #ctx; #client; #pending; #aggregates = new Map(); #aggregating = false; // TODO pending aggregates - pozriet ci tam nemam svoje keys ak mam tak sa len doplnim do calls

    constructor( options )
    {
        this.#client = new Client({ webroot: options.webroot });
    }

    _tick()
    {
        console.log( 'TICK ' + this.#aggregates.size + ' aggregates' );

        for( let aggregate of this.#aggregates.values() )
        {
            //console.log( aggregate, { ...aggregate.args, [aggregate.aggregator+'[]']: aggregate.keys } );

            this._aggregated_request( aggregate.method, { ...aggregate.args, [aggregate.aggregator]: aggregate.keys }, aggregate.ctx, aggregate.aggregator ).then( aggregated_response =>
            {
                console.log('aggregated_response ' + aggregate.method + ' ' + aggregated_response.size, aggregate.keys );

                for( let call of aggregate.calls )
                {
                    let result;

                    if( Array.isArray( call.keys ))
                    {
                        result = call.keys.map( key => aggregated_response.get( key ));
                    }
                    else
                    {
                        result = aggregated_response.get( call.keys );
                    }

                    call.resolve( result );
                }
            });
        }

        this.#aggregating = false;
        this.#aggregates.clear();
    }

    async _request( method, args, ctx )
    {
        let api = API[method];

        const response = await this.#client[api.method]( api.url, 
        {
            query   : ( api.query || []).reduce(( q, p ) => ( args.hasOwnProperty(p) && ( q[p] = args[p] ), q ), { ...ctx }),
            body    : api.body ? ( api.body || []).reduce(( b, p ) => ( args.hasOwnProperty(p) && ( b[p] = args[p] ), b ), { ...ctx }) : undefined
        });

        return response.json;
    }

    async _aggregated_request( method, args, ctx, aggregator )
    {
        const response = await this._request( method, args, ctx );
        const aggregated_response = args[ aggregator ].reduce(( a, key, i ) => ( a.set( key, response[i] ), a ), new Map());

        return aggregated_response;
    }

    async call( method, args, ctx )
    {
        let api = API[method];

        let start = process.hrtime();

        //console.log({ method, args, ctx, api });

        if( api.aggregate )
        {
            return new Promise(( resolve, reject ) =>
            {
                let aggregator = api.aggregate[0], keys = args[ aggregator ];
                let aggregate_id = method + ':' + ObjectHash({ ...ctx, ...args }, [ aggregator ]); // TODO len kluce z aggregate
                let aggregate = this.#aggregates.get( aggregate_id );

                if( !aggregate )
                {
                    this.#aggregates.set( aggregate_id, aggregate = { method, args, ctx, calls: [], keys: [], aggregator });
                }

                aggregate.calls.push({ resolve, reject, keys });

                for( let key of ARR( keys ))
                {
                    if( !aggregate.keys.includes( key ))
                    {
                        aggregate.keys.push( key );
                    }
                }

                if( !this.#aggregating ){ this.#aggregating = true; process.nextTick( this._tick.bind( this ))}
            });
        }
        else
        {
            return this._request( method, args, ctx );
        }
        /*

        

        let end = process.hrtime( start );

        //console.log( method + ' took ' + ( end[0] * 1e3 + end[1] / 1e6 ).toFixed(2) + 'ms', result );
        const result = this._request( method, args, ctx );

        return result;

        //let response = await this.#client[method]( url, { query: { ...ctx }})
        */
    }
}