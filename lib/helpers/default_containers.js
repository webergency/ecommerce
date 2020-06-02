module.exports.DefaultMap = class DefaultMap extends Map
{
    #getter;

    constructor( getter )
    {
        super();

        this.#getter = getter;
    }

    get( key, getter )
    {
        if( !this.has( key ) && ( getter = getter || this.#getter ))
        {
            this.set( key, getter( key ));
        }
        
        return super.get( key );
    }
}

module.exports.DefaultWeakMap = class DefaultWeakMap extends WeakMap
{
    #getter;

    constructor( getter )
    {
        super();

        this.#getter = getter;
    }

    get( key, getter )
    {
        if( !this.has( key ) && ( getter = getter || this.#getter ))
        {
            this.set( key, getter( key ));
        }
        
        return super.get( key );
    }
}