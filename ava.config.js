export default { // eslint-disable-line import/no-anonymous-default-export
	files: ['test/**/*.spec.ts'],
	failWithoutAssertions: false,
	typescript: {
		compile: false,
		rewritePaths: {
			'test/': 'dist/test/',
		},
	},
};
