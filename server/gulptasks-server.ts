import fs from "fs";
import path from "path";
import child_process from "child_process";
import gulp from "gulp";
// @ts-ignore
import gulpLog from "gulplog";
// TODO [8/1/21 @ 4:19 PM] This one needs type declarations as well...
import del from "del";
import typescript, { Project as TypeScriptProject } from "gulp-typescript";
import sourcemaps from "gulp-sourcemaps";
import { DoneFunction, GulpTasks, TaskFunction } from "../build/gulptasks";
import { ensureDirectoryExists } from "../build/util";
import { settings } from "../build/build-settings";

const scopeName: string = "server";

let functionsToRename: TaskFunction[] = [
	clean,
	build,
	rebuild,
	cleanJavaScript,
	buildJavaScript,
	rebuildJavaScript,
	generateNodeModulesDirectory,
	compileTypeScript,
	cleanExtraFiles,
	buildExtraFiles,
	rebuildExtraFiles,
	copyExtraFiles
];

for (let func of functionsToRename) (func as any).displayName = `${scopeName}.${func.name}`;

export class ServerGulpTasks extends GulpTasks {
	
	public constructor() {
		
		super("server");
		
		this.task("default", rebuild);
		this.task("clean", clean);
		this.task("clean-javascript", cleanJavaScript);
		this.task("clean-extras", cleanExtraFiles);
		this.task("build", build);
		this.task("build-javascript", buildJavaScript);
		this.task("build-extras", buildExtraFiles);
		this.task("rebuild", rebuild);
		this.task("rebuild-javascript", rebuildJavaScript);
		this.task("rebuild-extras", rebuildExtraFiles);
		
	}
	
}

// Generic tasks.

function clean(done: DoneFunction): ReturnType<TaskFunction> {
	
	gulp.parallel(
		cleanJavaScript,
		cleanExtraFiles
	)(done);
	
}

function build(done: DoneFunction): ReturnType<TaskFunction> {
	
	gulp.parallel(
		buildJavaScript,
		buildExtraFiles
	)(done);
	
}

function rebuild(done: DoneFunction): ReturnType<TaskFunction> {
	
	gulp.parallel(
		clean,
		build
	)(done);
	
}

// JavaScript tasks.

function cleanJavaScript(done: DoneFunction): ReturnType<TaskFunction> {
	
	return del(
		settings.server.javascript.filesToClean,
		{ force: true }
	);
	
}

function buildJavaScript(done: DoneFunction): ReturnType<TaskFunction> {
	
	gulp.parallel(
		generateNodeModulesDirectory,
		compileTypeScript
	)(done);
	
}

function rebuildJavaScript(done: DoneFunction): ReturnType<TaskFunction> {
	
	gulp.series(
		cleanJavaScript,
		buildJavaScript
	)(done);
	
}

function generateNodeModulesDirectory(done: DoneFunction): ReturnType<TaskFunction> {
	
	ensureDirectoryExists(settings.serverDistributionDirectory);
	
	if (settings.environment === "production") {
		
		// FIX-ME [7/31/21 @ 1:22 AM] Copy package.json to 'dist/' directory before running NPM install command.
		
		child_process.exec(
			`npm install --prefix ${settings.serverDistributionDirectory}`,
			(error: child_process.ExecException | null, stdout: string, stderr: string): void => done(error)
		);
		
	} else {
		
		return gulp.src(settings.server.javascript.nodeModules.sourceDirectory)
			.pipe(gulp.symlink(settings.server.javascript.nodeModules.outputDirectory));
		
	}
	
}

function compileTypeScript(done: DoneFunction): ReturnType<TaskFunction> {
	
	ensureDirectoryExists(settings.serverDistributionDirectory);
	
	let typescriptProject: TypeScriptProject = typescript.createProject(settings.server.javascript.tsconfig);
	
	return typescriptProject.src()
		.pipe(sourcemaps.init())
		.pipe(typescriptProject())
		.js
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(settings.server.javascript.outputDirectory));
	
}

// Tasks for 'extra' files.

function cleanExtraFiles(done: DoneFunction): ReturnType<TaskFunction> {
	
	return del(
		Object.values(settings.server.miscFilesToCopy),
		{ force: true }
	);
	
}

function buildExtraFiles(done: DoneFunction): ReturnType<TaskFunction> {
	
	return copyExtraFiles(done);
	
}

function rebuildExtraFiles(done: DoneFunction): ReturnType<TaskFunction> {
	
	gulp.series(
		cleanExtraFiles,
		copyExtraFiles
	)(done);
	
}

function copyExtraFiles(done: DoneFunction): ReturnType<TaskFunction> {
	
	ensureDirectoryExists(settings.serverDistributionDirectory);
	
	let promises: Promise<any>[] = [];
	
	for (let sourceFilePath of Object.keys(settings.server.miscFilesToCopy)) {
		
		promises.push(new Promise<void>(async (resolve: () => void, reject: (error: Error) => void): Promise<void> => {
			
			fs.access(sourceFilePath, fs.constants.F_OK, (accessError: NodeJS.ErrnoException | null): void => {
				
				if (accessError === null) {
					
					fs.readFile(sourceFilePath,
						(error: NodeJS.ErrnoException | null, data: string | Buffer): void => {
						
						if (error !== null) {
							
							reject(new Error(`Failed to read from source file '${sourceFilePath}' while copying ` +
								`files.`));
							
						} else {
							
							fs.writeFile(settings.server.miscFilesToCopy[sourceFilePath], data,
								(writeError: NodeJS.ErrnoException | null): void => {
								
								if (writeError !== null) {
									
									reject(new Error(`Failed to write file contents to destination file ` +
										`'${settings.server.miscFilesToCopy[sourceFilePath]}' while copying files.`));
									
								} else resolve();
								
							});
							
						}
							
					});
					
				} else {
					
					gulpLog.warn(`Could not find file '${sourceFilePath}' to copy to ` +
						`'${settings.server.miscFilesToCopy[sourceFilePath]}' (expected file to be at path: ` +
						`'${path.resolve(sourceFilePath)}').`);
					
					resolve();
					
				}
				
			});
			
		}));
		
	}
	
	return Promise.all(promises);
	
}
