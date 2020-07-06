'use strict';

const Client = require('@liqd-js/client');
const handle = require('@liqd-js/handle');

const API = 
{
    'product.get' :
    {
        arguments   : [ 'id', 'scope' ],
        method      : 'get',
        url         : 'product',
        query       : [ 'id', 'scope' ],
        aggregate   : [ 'id', [ 'scope' ]],
    },
    'parameter.get' :
    {
        arguments   : [ 'id' ],
        method      : 'get',
        url         : 'parameter',
        query       : [ 'id' ],
        aggregate   : [ 'id', []]
    },
    'parameter.value' :
    {
        arguments   : [ 'id' ],
        method      : 'get',
        url         : 'parameter/value',
        query       : [ 'id' ],
        aggregate   : [ 'id', []]
    },
    'image.get' :
    {
        arguments   : [ 'id' ],
        method      : 'get',
        url         : 'image',
        query       : [ 'id' ],
        aggregate   : [ 'id', []]
    },
    'gallery.get' :
    {
        arguments   : [ 'id' ],
        method      : 'get',
        url         : 'gallery',
        query       : [ 'id' ],
        aggregate   : [ 'id', []]
    }
}

function getAPI( path )
{
    let api = API[ path.join('.') ];

    if( !api ){ throw 'not_found' }

    return api;
}

module.exports = function( options )
{
    const client = new Client({ webroot: options.webroot });

    return (
    {
        apply   : ( core, path, args ) => 
        {
            let api = getAPI( path );

            //return client.get( api.url, { query: { id: [ args[0] ], ...core._scope() }}).then( r => r.json );
            return client.get( api.url, { query: { id: args[0], ...core._scope() }}).then( r => r.json );

        },
        get     : ( core, path ) => 
        {

        }
    });
}