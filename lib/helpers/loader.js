'use strict';

module.exports = class Loader
{
    #promise; #resolve; #reject;

    constructor( onResolve, onReject, onFinally )
    {
        let promise = this.#promise = new Promise(( resolve, reject ) =>
        {
            this.#resolve = resolve;
            this.#reject = reject;
        });

        onResolve && ( promise = promise.then( onResolve ));
        onReject && ( promise = promise.catch( onReject ));
        onFinally && ( promise = promise.finally( onFinally ));
    }

    get promise(){ return this.#promise }

    loaded()
    {
        this.#resolve();
    }

    failed()
    {
        this.#reject();
    }
}