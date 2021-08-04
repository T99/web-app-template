import type Jest from "@jest/types";

const config: Jest.Config.InitialOptions = {
	
	// Automatically clear mock calls and instances between every test
	clearMocks: true,
	
	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: true,
	
	// The directory where Jest should output its coverage files
	coverageDirectory: "tests/coverage",
	
	// A list of paths to directories that Jest should use to search for files in
	roots: [
		"<rootDir>/tests"
	],
	
	// The test environment that will be used for testing
	testEnvironment: "node",
	
	// Transforms input file paths to be ready to use for ts-jest.
	transform: {
		"^.+\\.(ts|tsx)$": "ts-jest"
	}
	
};

export default config;
