import {setTimeout} from 'timers/promises';
import {Context} from '../source/index.js';

export async function setup() {
	const ctx = new Context('ctx');
	await ctx.task('task', async () => {
		await setTimeout(5e3);
		throw Math.random();
	});
}
