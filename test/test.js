'use strict';
const fs = require('fs');

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

require('./mock/server');

describe( 'Tests', ( done ) =>
{
	var files = fs.readdirSync( __dirname + '/tests' );

	for( let file of files )
	{
		//if( !file.match(/\.js$/)/** / || ![ 'callbacks.js', 'freeze.js', 'nonexisting.js' ].includes( file )/**/ ){ continue; }
		//if( !file.match(/\.js$/)/**/ || ![ /*'sessions.js', 'carts.js', 'users.js', 'products.js', 'categories.js' 'parameters.js' ].includes( file )/**/ ){ continue; }
		if( !file.match(/\.js$/)/**/ || ![ 'categories.js' ].includes( file )/**/ ){ continue; }

		describe( file, () =>
		{
			require( __dirname + '/tests/' + file );
		});
	}
});
