export type BuildSettings = {
	
	/**
	 * The environment for which code should be build.
	 *
	 * Value should either be 'production' or 'development'.
	 */
	environment: "production" | "development",
	
	/**
	 * The directory in which client source files are stored.
	 */
	clientSourceDirectory: string,
	
	/**
	 * The directory that the compiled client should be output to.
	 */
	clientDistributionDirectory: string,
	
	/**
	 * The directory in which server source files are stored.
	 */
	serverSourceDirectory: string,
	
	/**
	 * The directory that the compiled server should be output to.
	 */
	serverDistributionDirectory: string,
	
	/**
	 * Settings for building the client.
	 */
	client: {
		
		/**
		 * CSS and Sass related settings.
		 */
		stylesheets: {
			
			/**
			 * An array of paths/globs that should be deleted during 'clean' operations.
			 */
			filesToClean: string[],
			
			/**
			 * Controls whether or not compiled CSS files are minified.
			 */
			enableMinification: boolean,
			
			/**
			 * The path/glob to Sass files that should be compiled during the stylesheets build process.
			 */
			sassFiles: string,
			
			/**
			 * The directory that compiled CSS files should be output to.
			 */
			outputDirectory: string
			
		},
		
		/**
		 * JavaScript (and TypeScript) related settings.
		 */
		javascript: {
			
			/**
			 * An array of paths/globs that should be deleted during 'clean' operations.
			 */
			filesToClean: string[],
			
			/**
			 * The path to the tsconfig.json TypeScript configuration file that will be used to configure a compiler to
			 * compile the client's TypeScript.
			 */
			tsconfig: string,
			
			/**
			 * The directory that JavaScript files from the TypeScript compilation process will be output to.
			 */
			outputDirectory: string,
			
			/**
			 * Controls whether or not compiled JS files are minified.
			 */
			enableMinification: boolean,
			
			/**
			 * Controls whether or not compiled JS files are uglified.
			 */
			enableUglification: boolean,
			
			/**
			 * Settings related to Webpack.
			 */
			webpack: {
				
				/**
				 * Whether or not Webpack should be used to transpile Node-style JS to browser-style JS.
				 */
				enableWebpacking: boolean,
				
				/**
				 * The file at which Webpack will begin to build a bundle file.
				 */
				entryFile: string,
				
				/**
				 * The file path/name at which Webpack will output a bundle file, ready for the browser.
				 */
				bundleFile: string
				
			},
			
			/**
			 * Path information regarding the node_modules directory.
			 */
			nodeModules: {
				
				/**
				 * The path that the distribution node_modules directory should be symlinked from if the client is being
				 * built in the 'development' environment.
				 */
				sourceDirectory: string,
				
				/**
				 * The path that the distribution node_modules directory should appear at.
				 */
				outputDirectory: string
				
			}
			
		}
		
	}
	
	/**
	 * Settings for building the server.
	 */
	server: {
		
		/**
		 * JavaScript (and TypeScript) related settings.
		 */
		javascript: {
			
			/**
			 * An array of paths/globs that should be deleted during 'clean' operations.
			 */
			filesToClean: string[],
			
			/**
			 * The path to the tsconfig.json TypeScript configuration file that will be used to configure a compiler to
			 * compile this server's TypeScript.
			 */
			tsconfig: string,
			
			/**
			 * The directory that JavaScript files from the TypeScript compilation process will be output to.
			 */
			outputDirectory: string,
			
			/**
			 * Path information regarding the node_modules directory.
			 */
			nodeModules: {
				
				/**
				 * The path that the distribution node_modules directory should be symlinked from if the server is being
				 * built in the 'development' environment.
				 */
				sourceDirectory: string,
				
				/**
				 * The path that the distribution node_modules directory should appear at.
				 */
				outputDirectory: string
				
			}
			
		};
		
		/**
		 * An object specifying file copy operations that should occur for each build.
		 *
		 * <pre>
		 * {
		 *   "<source file path>": "<path to copy source file to>",
		 *   "...": "..."
		 * }
		 * </pre>
		 */
		miscFilesToCopy: {
			
			[sourceFile: string]: string
			
		};
		
	}
	
};

export const settings: BuildSettings = {
	
	environment: "development",
	
	clientSourceDirectory: "client/",
	
	clientDistributionDirectory: "dist/serve/",
	
	serverSourceDirectory: "server/",
	
	serverDistributionDirectory: "dist/",
	
	client: {
		
		stylesheets: {
			
			filesToClean: [
				"dist/serve/css/**/*.css",
				"dist/serve/css/**/*.css.map",
				"dist/serve/css/"
			],
			
			enableMinification: true,
			
			sassFiles: "client/styles/**/*.scss",
			
			outputDirectory: "dist/serve/css"
			
		},
		
		javascript: {
			
			filesToClean: [
				"dist/serve/js/**/*.js",
				"dist/serve/js/**/*.js.map",
				"dist/serve/js/",
				"dist/serve/node_modules/"
			],
			
			tsconfig: "client/ts/tsconfig.json",
			
			outputDirectory: "dist/serve/js/",
			
			enableMinification: false,
			
			enableUglification: false,
			
			webpack: {
				
				enableWebpacking: true,
				
				entryFile: "dist/serve/js/main.js",
				
				bundleFile: "dist/serve/js/bundle.js"
				
			},
			
			nodeModules: {
				
				sourceDirectory: "client/node_modules/",
				
				outputDirectory: "dist/serve/node_modules/"
				
			}
			
		}
		
	},
	
	server: {
		
		javascript: {
			
			filesToClean: [
				"dist/**/*.js",
				"dist/**/*.js.map",
				"dist/node_modules/",
				"!dist/serve/**"
			],
			
			tsconfig: "server/tsconfig.json",
			
			outputDirectory: "dist/",
			
			nodeModules: {
				
				sourceDirectory: "server/node_modules/",
				
				outputDirectory: "dist/node_modules/"
				
			}
			
		},
		
		miscFilesToCopy: {
			"server/settings.json": "dist/settings.json",
			"server/credentials.json": "dist/settings.json"
		}
		
	}
	
};

// Check that a proper value is set for the `environment` setting.
if (!["production", "development"].includes(settings.environment)) {
	
	throw new Error(`Unknown environment '${settings.environment}'... choose either 'production' or 'development'.`);
	
}
