import gulp from "gulp";
import { DoneFunction, GulpTasks, TaskFunction } from "./build/gulptasks";
import { ClientGulpTasks } from "./client/gulptasks-client";
import { ServerGulpTasks } from "./server/gulptasks-server";

let taskCollections: GulpTasks[] = [
	new ClientGulpTasks(),
	new ServerGulpTasks()
];

let sharedTasks: string[] = [
	"default",
	"clean",
	"build",
	"rebuild"
];

for (let sharedTask of sharedTasks) {
	
	let taskFunctions: TaskFunction[] =
		taskCollections
			.map((tasks: GulpTasks): TaskFunction | undefined => tasks.getTask(sharedTask))
			.filter((potentialTaskFunction?: TaskFunction): boolean => potentialTaskFunction !== undefined) as TaskFunction[];
	  
	gulp.task(sharedTask, (done: DoneFunction): void => {
		
		gulp.parallel(...taskFunctions)(done);
		
	});
	
}

for (let taskCollection of taskCollections) taskCollection.applyNamespacedTasks(gulp);
