import test from 'ava';
import { setup } from './setup.js';

// NOTE these tests cannot be used as automated tests to prove the code works.
// Yes, this is confusing and wrong.

test('bar', async (t) => {
	try {
		await setup();
	} catch(e) {
		t.log(e);
	}
});
