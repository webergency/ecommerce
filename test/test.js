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
		if( !file.match(/\.js$/)/** / || ![ 'callbacks.js', 'freeze.js', 'nonexisting.js' ].includes( file )/**/ ){ continue; }
		//if( !file.match(/\.js$/)/**/ || ![ 'products.js', 'carts.js', 'sessions.js' ].includes( file )/**/ ){ continue; }

		describe( file, () =>
		{
			require( __dirname + '/tests/' + file );
		});
	}
});
