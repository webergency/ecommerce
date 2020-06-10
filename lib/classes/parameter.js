'use strict';

const ObjectMerge = require('@liqd-js/alg-object-merge');
const { DefaultMap, DefaultWeakMap } = require('../helpers/default_containers');

const ParametersCache = new DefaultWeakMap(() => new DefaultMap());
const ParametersValuesCache = new DefaultWeakMap(() => new DefaultMap());

class ParameterValue
{
    #ctx; #data = {};

    static async get( ctx, id )
    {
        let parameter_value = ParametersValuesCache.get( ctx ).get( id, () => new ParameterValue( ctx, id ));

        /*preload_scope &&*/ await parameter_value.load();

        return parameter_value;
    }

    constructor( ctx, id )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    _scope()
    {
        return { country: this.#ctx.flow.get('country') || this.#ctx.country, locale: this.#ctx.flow.get('locale') || this.#ctx.locale }
    }

    async load()
    {
        const { country, locale } = this._scope();

        let parameter_value = await this.#ctx.client.get( 'parameter/value', { query: { id: this.id, country, locale }}).then( r => r.json );

        ObjectMerge( this.#data, 
        {
            parameterID : parameter_value.parameterID,
            sequence    : parameter_value.sequence,
            value       : { [locale]: parameter_value.value }
        });
    }

    get parameterID()
    {
        return this.#data.parameterID;
    }

    get sequence()
    {
        return this.#data.sequence;
    }

    get value()
    {
        const { locale } = this._scope();

        return this.#data.value?.[ locale ];
    }
}

module.exports = class Parameter
{
    #ctx; #data = {}; #valueIDs; #values = [];

    static async get( ctx, id, valueIDs )
    {
        //return ParametersCache.get( ctx ).get( id, () => new Parameter( ctx, id ));

        let parameter = new Parameter( ctx, id, valueIDs );

        await parameter.load();

        return parameter;
    }

    constructor( ctx, id, valueIDs )
    {
        this.#ctx = ctx;
        this.#valueIDs = valueIDs;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    _scope()
    {
        return { country: this.#ctx.flow.get('country') || this.#ctx.country, locale: this.#ctx.flow.get('locale') || this.#ctx.locale }
    }

    async load()
    {
        const { country, locale } = this._scope();

        let parameter = await this.#ctx.client.get( 'parameter', { query: { id: this.id, country, locale }}).then( r => r.json );

        ObjectMerge( this.#data, 
        {
            type        : parameter.type,
            priority    : parameter.priority,
            sequence    : parameter.sequence,
            label       : { [locale]: parameter.label }
        });

        this.#values = await Promise.all( this.#valueIDs.map( id => ParameterValue.get( this.#ctx, id )));
    }

    get type()
    {
        return this.#data.type;
    }

    get priority()
    {
        return this.#data.priority;
    }

    get sequence()
    {
        return this.#data.sequence;
    }

    get label()
    {
        const { locale } = this._scope();

        return this.#data.label?.[ locale ];
    }

    get values()
    {
        return this.#values;
    }
}