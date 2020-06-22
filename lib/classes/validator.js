'use strict';

const DNS = require('dns');
const ObjectHash = require('../helpers/object_hash');
const Client = require('@liqd-js/client');
const API = new Client({ webroot: 'https://billing.webergency.com/api/validator' });

function DomainExists( domain )
{
    return new Promise( resolve => DNS.resolve4( domain, err => resolve( !err )));
}

const cache = new Map();

module.exports = class Validator
{
    static async company( company )
    {
        let hash = ObjectHash( company );

        return cache.get( hash ) || API.get( 'company', { query: company }).then( r => r.json ).then( r => ( cache.set( hash, r ), r ));
    }

    static async email( email )
    {
        return DomainExists( email.replace( /^.*@/, '' ));
    }

    static normalize( value, type )
    {
        value = ( value || '' ).trim();

        if( type === 'zip' )
        {
            if( !/^\d{5}(-\d{4})?$/.test( value = value.replace( /[^\d-]/g, '' )))
            {
                throw 'invalid_value';
            }
        }
        else if( type === 'phone' )
        {
            if( !/^+?\d{7,15}$/.test( value = value.replace( /[^\d+]/g, '' )))
            {
                throw 'invalid_value';
            }
        }
        else if( type === 'email' )
        {
            if( !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test( value = value.toLowerCase().replace( /\s+/g, '' )))
            {
                throw 'invalid_value';
            }
        }
        else if( type === 'crn' )
        {
            if( !/^\d{8,12}$/.test( value = value.replace( /[^\d]/g, '' )))
            {
                throw 'invalid_value';
            }
        }
        else if( type === 'tax' )
        {
            if( !/^\d{8,15}$/.test( value = value.replace( /[^\d]/g, '' )))
            {
                throw 'invalid_value';
            }
        }
        else if( type === 'vat' )
        {
            if( !/^[A-Z]{2,3}\d{8,15}$/.test( value = value.replace( /[^A-Z\d]/g, '' )))
            {
                throw 'invalid_value';
            }
        }

        return value;
    }
}