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

        await parameter_value.load();

        return parameter_value;
    }

    constructor( ctx, id )
    {
        this.#ctx = ctx;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    async load()
    {
        const { locale } = this.#ctx.scope();

        if( this.#data.label?.[locale] === undefined )
        {
            let parameter_value = await this.#ctx.core2.parameter.value( this.id );

            ObjectMerge( this.#data, 
            {
                parameterID : parameter_value.parameterID,
                sequence    : parameter_value.sequence,
                label       : { [locale]: parameter_value.label },
                data        : parameter_value.data || {}
            });
        }
    }

    get parameterID()   { return this.#data.parameterID }
    get sequence()      { return this.#data.sequence }
    get label()         { return this.#data.label?.[ this.#ctx.scope().locale ]}
    get data()          { return this.#data.data }
}

module.exports = class Parameter
{
    #ctx; #data = {}; #valueIDs; #values = [];

    static async get( ctx, id, valueIDs = [])
    {
        let parameter = ParametersCache.get( ctx ).get( id = parseInt( id ), () => new Parameter( ctx, id ));

        parameter = parameter._clone( valueIDs );

        await parameter.load();

        return parameter;
    }

    constructor( ctx, id, valueIDs = [])
    {
        this.#ctx = ctx;
        this.#valueIDs = valueIDs;

        Object.defineProperty( this, 'id', { value: id, writable: false, enumerable: true });
    }

    _clone( valueIDs )
    {
        let clone = new Parameter( this.#ctx, this.id, valueIDs );

        clone.#data = this.#data;

        return clone;
    }

    _clone( valueIDs )
    {
        let clone = new Parameter( this.#ctx, this.id, valueIDs );

        clone.#data = this.#data;

        return clone;
    }

    async load()
    {
        const { locale } = this.#ctx.scope();

        if( this.#data.label?.[locale] === undefined )
        {
            let parameter = await this.#ctx.core2.parameter.get( this.id );

            ObjectMerge( this.#data, 
            {
                type        : parameter.type,
                priority    : parameter.priority,
                sequence    : parameter.sequence,
                unit        : parameter.unit,
                unitCode    : parameter.unitCode,
                label       : { [locale]: parameter.label }
            });
        }

        this.#values = await Promise.all( this.#valueIDs.map( id => ParameterValue.get( this.#ctx, id )));
    }

    get type()      { return this.#data.type }
    get priority()  { return this.#data.priority }
    get sequence()  { return this.#data.sequence }
    get unit()      { return this.#data.unit }
    get unitCode()  { return this.#data.unitCode }
    get label()     { return this.#data.label?.[ this.#ctx.scope().locale ]}
    get values()    { return this.#values }
}