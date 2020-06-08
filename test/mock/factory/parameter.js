module.exports.ParameterFactory = function ParameterFactory( id, locale, type = 'parameter' )
{
    id = parseInt( id );

    if( type === 'parameter' )
    {
        return (
        {
            id,
            type     : 'Type ' + id,
            priority : 1,
            sequence : 1,
            label    : locale + ' Parameter ' + id
        });
    }
    else
    {
        return (
        {
            id,
            parameterID : 1 + id,
            sequence    : 1,
            value       :  locale + ' ParameterValue ' + id
        });
    }
}