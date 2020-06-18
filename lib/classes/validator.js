'use strict';

const Client = require('@liqd-js/client');
const API = new Client({ webroot: 'https://billing.webergency.com/api/validator' });

class Validator
{
    static async company( company )
    {
        return API.get( 'company', { query: company });
    }
}