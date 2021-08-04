import Undertaker from "undertaker";
import { ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { Stream } from "stream";
import { Observable } from "async-done";

export type DoneFunction = (error?: Error | null | undefined) => void;

type TaskMetaData = {
	displayName?: string,
	description?: string,
	flags?: { [flagName: string]: string }
};

export type TaskFunction = TaskMetaData &
	((done: DoneFunction) => void | ChildProcess | EventEmitter | Observable | PromiseLike<any> | Stream);

export abstract class GulpTasks {
	
	protected registryName: string;
	
	public tasks: {
		[taskName: string]: TaskFunction
	};
	
	protected constructor(registryName: string) {
		
		this.registryName = registryName;
		this.tasks = {};
		
	}
	
	public task(taskName: string, taskFunction: TaskFunction): void {
		
		taskFunction.displayName = `${this.registryName}.${taskName}`;
		
		this.tasks[taskName] = taskFunction;
		
	}
	
	public applyNamespacedTasks(gulp: Undertaker): void {
		
		for (let taskName of Object.keys(this.tasks)) {
			
			gulp.task(`${this.registryName}.${taskName}`, this.tasks[taskName]);
			
		}
		
	}
	
	public getTask(taskName: string): TaskFunction | undefined {
		
		return this.tasks[taskName];
		
	}
	
}
