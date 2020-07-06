'use strict';

const Handle = require('@liqd-js/handle');
const EcommerceHTTPTransport = require('./transports/http');

const { ObjectHash } = require('../helpers/object');

class EcommerceCore
{
    #handler; #ecommerce;

    constructor( options )
    {
        this.#ecommerce = options.ecommerce;
        this.#handler = EcommerceHTTPTransport( options );
    }

    _scope()
    {
        return { country: this.#ecommerce.flow.get('country') || this.#ecommerce.country, locale: this.#ecommerce.flow.get('locale') || this.#ecommerce.locale }
    }

    get handler(){ return this.#handler }
}

module.exports = new Proxy( EcommerceCore,
{
    construct( _, [ options ])
    {
        let core = new EcommerceCore( options );

        return new Handle( core, core.handler );
    }
});