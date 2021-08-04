import fs from "fs";

let directoryInitializationMap: { [path: string]: boolean } = {};

/**
 * Creates the specified directory if is does not already exist.
 */
export function ensureDirectoryExists(path: string): void {
	
	if (directoryInitializationMap[path] !== true) {
		
		if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
		
		directoryInitializationMap[path] = true;
		
	}
	
}
