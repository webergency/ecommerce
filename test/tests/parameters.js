'use strict';

const assert = require('assert');
const MockServer = require('../mock/server');
const { randomIDs, parameters, images } = require('../mock/factory/product');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create parameter handle', done =>
{
    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080', locale: 'cz' });

    shop.flow.start( async() =>
        {
            let id = 1, parameter = shop.parameter( id );

            assert.equal( parameter.constructor.name, 'Parameter' );
            assert.equal( parameter.id, id );
            assert.equal( parameter, shop.parameter( id ));

            let parameter_data = await parameter.data();

            assert.equal( parameter_data.id, id );

            await server.destroy();

            done();
        },
        { locale: 'sk' })
});

it( 'should fetch parameter random data', async() =>
{
    let locale = 'sk';

    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080', locale });

    for( let id = 1; id < 100; ++id )
    {
        let parameter = shop.parameter( id );
        let parameter_data = await parameter.data();

        assert.equal( parameter_data.id, id );
        assert.equal( parameter_data.label, ( locale + ' Parameter ' + id ) );
        assert.equal( parameter_data.type, 'Type ' + id );
        assert.equal( parameter_data.priority, 1 );
        assert.equal( parameter_data.sequence, 1 );
    }

    await server.destroy();
});

it( 'should fetch parameterValue random data', async() =>
{
    let locale = 'sk';

    let server = new MockServer( 8080 ), shop = new Ecommerce({ webroot: 'http://localhost:8080', locale });

    for( let id = 1; id < 100; ++id )
    {
        let parameter = shop.parameter( id );
        let parameterValue_data = await parameter.values();

        assert.equal( parameterValue_data.id, id );
        assert.equal( parameterValue_data.parameterID, 1 + id );
        assert.equal( parameterValue_data.sequence, 1 );
        assert.equal( parameterValue_data.value, ( locale + ' ParameterValue ' + id ) );
    }

    await server.destroy();
});

