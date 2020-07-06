'use strict';

const assert = require('assert');
const Ecommerce = require('../../lib/ecommerce');

it( 'should create parameter handle', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    let id = 1, parameter = await shop.parameter( id );

    assert.strictEqual( parameter.constructor.name, 'Parameter' );
    assert.strictEqual( parameter.id, id );
});

it( 'should fetch parameter data', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    let id = 1, parameter = await shop.parameter( id );

    assert.strictEqual( parameter.type,       'range' );
    assert.strictEqual( parameter.priority,   10 );
    assert.strictEqual( parameter.sequence,   1 );
    assert.strictEqual( parameter.unit,       'cm' );
    assert.strictEqual( parameter.unitCode,   'CMT' );
    assert.strictEqual( parameter.label,      'Výška' );
    assert.deepStrictEqual( parameter.values,     []);
});

it( 'should fetch parameter values', async() =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    let id = 1, parameter = await shop.parameter( id, [ 1, 2, 3, 4, 5 ]), i = 0;

    let parameter2 = await shop.parameter( id, [ 1, 2, 3, 4, 5 ]);

    for( let parameter_value of parameter.values )
    {
        assert.strictEqual( parameter_value.parameterID,  id );
        assert.strictEqual( parameter_value.sequence,     i + 1 );
        assert.strictEqual( parameter_value.label,        ( 100 + i * 20 ).toString() );

        assert.strictEqual( parameter_value, parameter2.values[i++] );
    }
});

it( 'should fetch parameter in current locale', ( done ) =>
{
    let shop = new Ecommerce({ webroot: 'http://localhost:8081', locale: 'sk', country: 'SK' });

    shop.flow.start( async() =>
    {
        let id = 2, parameter = await shop.parameter( id, [ 8 ]);

        assert.strictEqual( parameter.label,              'Farba' );
        assert.strictEqual( parameter.values[0].label,    'červená' );

        shop.flow.start( async() =>
        {
            let id = 2, parameter = await shop.parameter( id, [ 8 ]);

            assert.strictEqual( parameter.label,              'Barva' );
            assert.strictEqual( parameter.values[0].label,    'rudá' );

            done();
        },
        { locale: 'cs', country: 'CZ' });
    });
});