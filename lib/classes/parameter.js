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

        if( this.#data.value?.[locale] === undefined )
        {
            let parameter_value = await this.#ctx.core.call( 'get_parameter/value', { id: this.id }, { country, locale });

            ObjectMerge( this.#data, 
            {
                parameterID : parameter_value.parameterID,
                sequence    : parameter_value.sequence,
                label       : { [locale]: parameter_value.label }
            });
        }
    }

    get parameterID()
    {
        return this.#data.parameterID;
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
}

module.exports = class Parameter
{
    #ctx; #data = {}; #valueIDs; #values = []; #cache = new Map();

    static async get( ctx, id, valueIDs = [])
    {
        id = parseInt( id );

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

        if( this.#data.label?.[locale] === undefined )
        {
            let parameter = this.#cache.get( this.id );

            if( !parameter )
            {
                this.#cache.set( this.id, parameter = await this.#ctx.core.call( 'get_parameter', { id: this.id }, { country, locale }));
            }

            ObjectMerge( this.#data, 
            {
                type        : parameter.type,
                priority    : parameter.priority,
                sequence    : parameter.sequence,
                unit        : parameter.unit,
                unitCode    : parameter.unitCode,
                label       : { [locale]: parameter.label }
            });

            this.#values = await Promise.all( this.#valueIDs.map( id => ParameterValue.get( this.#ctx, id )));
        }
    }

    get type(){ return this.#data.type }
    get priority(){ return this.#data.priority }
    get sequence(){ return this.#data.sequence }
    get unit(){ return this.#data.unit }
    get unitCode(){ return this.#data.unitCode }
    get label(){ return this.#data.label?.[ this._scope().locale ]}
    get values(){ return this.#values }
}