module.exports.ParameterFactory = function ParameterFactory( uid )
{
    let id = parseInt( uid );

    return (
    {
        id,
        label: 'Parameter ' + id,
        type: '',
        description: 'Description of the product ' + id,
        price: parseFloat(( Math.random() * 1000 ).toFixed(2))
    });
}