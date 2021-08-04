import child_process from "child_process";
import path from "path";
import gulp from "gulp";
import del from "del";
import sourcemaps from "gulp-sourcemaps";
import createSassCompiler from "gulp-sass";
import sassCompiler from "node-sass";
import cleanCSS from "gulp-clean-css";
import typescript, { Project as TypeScriptProject } from "gulp-typescript";
import webpack from "webpack-stream";
// @ts-ignore
import named from "vinyl-named";
// @ts-ignore
import through from "through2";
// TODO [8/1/21 @ 2:45 PM] Write type declaration for these two libraries...
import terser from "gulp-terser";
import { DoneFunction, GulpTasks, TaskFunction } from "../build/gulptasks";
import { ensureDirectoryExists } from "../build/util";
import { settings } from "../build/build-settings";

const sass: ReturnType<typeof createSassCompiler> = createSassCompiler(sassCompiler);

const scopeName: string = "client";

let functionsToRename: TaskFunction[] = [
	clean,
	build,
	rebuild,
	cleanStylesheets,
	buildStylesheets,
	rebuildStylesheets,
	compileSass,
	minifyStylesheets,
	cleanJavaScript,
	buildJavaScript,
	rebuildJavaScript,
	generateNodeModulesDirectory,
	compileTypeScript,
	transpileJavaScript,
	cleanUntranspiledJavaScript,
	minifyJavaScript
];

for (let func of functionsToRename) (func as any).displayName = `${scopeName}.${func.name}`;

export class ClientGulpTasks extends GulpTasks {
	
	public constructor() {
		
		super("client");
		
		this.task("default", rebuild);
		this.task("clean", clean);
		this.task("clean-stylesheets", cleanStylesheets);
		this.task("clean-javascript", cleanJavaScript);
		this.task("build", build);
		this.task("build-stylesheets", buildStylesheets);
		this.task("build-javascript", buildJavaScript);
		this.task("rebuild", rebuild);
		this.task("rebuild-stylesheets", rebuildStylesheets);
		this.task("rebuild-javascript", rebuildJavaScript);
		
	}
	
}

// Generic tasks.

function clean(done: DoneFunction): ReturnType<TaskFunction> {
	
	gulp.parallel(
		cleanStylesheets,
		cleanJavaScript
	)(done);
	
}

function build(done: DoneFunction): ReturnType<TaskFunction> {
	
	gulp.parallel(
		buildStylesheets,
		buildJavaScript
	)(done);
	
}

function rebuild(done: DoneFunction): ReturnType<TaskFunction> {
	
	gulp.series(
		clean,
		build
	)(done);
	
}

// Stylesheet tasks.

function cleanStylesheets(done: DoneFunction): ReturnType<TaskFunction> {
	
	return del(
		settings.client.stylesheets.filesToClean,
		{ force: true }
	);
	
}

function buildStylesheets(done: DoneFunction): ReturnType<TaskFunction> {
	
	let tasks: TaskFunction[] = [compileSass];
	
	if (settings.client.stylesheets.enableMinification) tasks.push(minifyStylesheets);
	
	gulp.series(...tasks)(done);
	
}

function rebuildStylesheets(done: DoneFunction): ReturnType<TaskFunction> {
	
	gulp.series(
		cleanStylesheets,
		buildStylesheets
	)(done);
	
}

compileSass.displayName = `${scopeName}.${compileSass.name}`;
function compileSass(done: DoneFunction): ReturnType<TaskFunction> {
	
	ensureDirectoryExists(settings.clientDistributionDirectory);
	
	return gulp.src(settings.client.stylesheets.sassFiles)
		.pipe(sourcemaps.init())
		.pipe(sass.sync().on("error", sass.logError))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(settings.client.stylesheets.outputDirectory));
	
}

function minifyStylesheets(done: DoneFunction): ReturnType<TaskFunction> {
	
	return gulp.src(path.join(settings.client.stylesheets.outputDirectory, "**/*.css"))
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(cleanCSS())
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(settings.client.stylesheets.outputDirectory));
	
}

// JavaScript tasks.

function cleanJavaScript(done: DoneFunction): ReturnType<TaskFunction> {
	
	return del(
		settings.client.javascript.filesToClean,
		{ force: true }
	);
	
}

function buildJavaScript(done: DoneFunction): ReturnType<TaskFunction> {
	
	let tasks: TaskFunction[] = [generateNodeModulesDirectory, compileTypeScript];
	
	if (settings.client.javascript.webpack.enableWebpacking) tasks.push(transpileJavaScript, cleanUntranspiledJavaScript);
	
	if (settings.client.javascript.enableMinification ||
		settings.client.javascript.enableUglification) tasks.push(minifyJavaScript);
	
	gulp.series(
		...tasks
	)(done);
	
}

function rebuildJavaScript(done: DoneFunction): ReturnType<TaskFunction> {
	
	gulp.series(
		cleanJavaScript,
		buildJavaScript
	)(done);
	
}

function generateNodeModulesDirectory(done: DoneFunction): ReturnType<TaskFunction> {
	
	ensureDirectoryExists(settings.clientDistributionDirectory);
	
	if (settings.environment === "production") {
		
		// FIX-ME [7/31/21 @ 1:22 AM] Copy package.json to 'dist/' directory before running NPM install command.
		
		child_process.exec(
			`npm install --prefix ${settings.clientDistributionDirectory}`,
			(error: child_process.ExecException | null, stdout: string, stderr: string): void => done(error)
		);
		
	} else {
		
		return gulp.src(settings.client.javascript.nodeModules.sourceDirectory)
			.pipe(gulp.symlink(settings.client.javascript.nodeModules.outputDirectory));
		
	}
	
}

function compileTypeScript(done: DoneFunction): ReturnType<TaskFunction> {
	
	ensureDirectoryExists(settings.clientDistributionDirectory);
	
	let typescriptProject: TypeScriptProject = typescript.createProject(settings.client.javascript.tsconfig);
	
	return typescriptProject.src()
		.pipe(sourcemaps.init())
		.pipe(typescriptProject())
		.js
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(settings.client.javascript.outputDirectory));
	
}

function transpileJavaScript(done: DoneFunction): ReturnType<TaskFunction> {
	
	return gulp.src(path.join(settings.client.javascript.outputDirectory, "**/*.js"))
		.pipe(named())
		.pipe(webpack({
			mode: settings.environment,
			devtool: (settings.environment === "development" ? "source-map" : false),
			entry: path.resolve(settings.client.javascript.webpack.entryFile),
			output: {
				path: path.resolve(path.dirname(settings.client.javascript.webpack.bundleFile)),
				filename: path.basename(settings.client.javascript.webpack.bundleFile)
			},
			resolve: {
				modules: [path.resolve(settings.client.javascript.nodeModules.outputDirectory)]
			},
			module: {
				rules: [
					{
						test: /\.js$/,
						exclude: /node_modules/,
						use: ["babel-loader"]
					}
				]
			},
			context: path.resolve(settings.clientDistributionDirectory)
		}))
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(through.obj(function (file: any, enc: any, cb: () => void): void {
			
			// Dont pipe through any source map files as it will be handled by gulp-sourcemaps
			
			// @ts-ignore Because 'this' is implicit and I don't want to make type definitions for that lib right now.
			if (!(/\.map$/.test(file.path))) this.push(file);
			cb();
			
		}))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(settings.client.javascript.outputDirectory));
	
}

function cleanUntranspiledJavaScript(done: DoneFunction): ReturnType<TaskFunction> {
	
	return del([
		...settings.client.javascript.filesToClean,
		"!" + settings.client.javascript.webpack.bundleFile
	], { force: true });
	
}

function minifyJavaScript(done: DoneFunction): ReturnType<TaskFunction> {
	
	ensureDirectoryExists(settings.clientDistributionDirectory);
	
	return gulp.src(settings.client.javascript.outputDirectory)
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(terser({
			compress: settings.client.javascript.enableMinification,
			mangle: settings.client.javascript.enableUglification
		}))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(settings.client.javascript.outputDirectory));
	
}
