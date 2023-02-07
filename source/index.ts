import {registerSharedWorker, SharedWorker} from 'ava/plugin';
import never from 'never';
import {Bucket, Data, Key, MessageType, TaskResult} from './types.js';

// CJS hacks
import { pathToFileURL } from 'url';
const import_meta_url = pathToFileURL(__filename);
// @ts-ignore
import type * as cooperate from '@ava/cooperate';
let {Lock, UnmanagedSemaphore, SharedContext} = {} as typeof cooperate;
const importEsmDeps = importEsmDepsWorker();
async function importEsmDepsWorker() {
	({Lock, UnmanagedSemaphore, SharedContext} = await import('@ava/cooperate'));
}

type ReceivedMessage = SharedWorker.Plugin.ReceivedMessage<Data>;

const protocol = registerSharedWorker<Data>({
	filename: new URL('worker.mjs', import_meta_url),
	supportedProtocols: ['ava-4'],
});

export class Context<T = any> {
	readonly #id: string;
	readonly #cooperatePrefix: string;
	#cooperateContext!: cooperate.SharedContext;

	constructor(id: string) {
		this.#id = id;
		this.#cooperatePrefix = import_meta_url + '\0' + id + '\0';
	}

	// CJS hacks
	async #initCooperate() {
		await importEsmDeps;
		this.#cooperateContext = new SharedContext(this.#cooperatePrefix);
	}

	async get<K extends Extract<keyof T, Key>>(name: K): Promise<T[K] | undefined> {
		return this.#get('values', name);
	}

	async #get(bucket: Bucket, name: Key): Promise<any> {
		const message = protocol.publish({
			type: MessageType.GET_REQUEST,
			context: this.#id,
			bucket,
			name,
		});

		for await (const reply of message.replies()) {
			if (reply.data.type === MessageType.GET_RESPONSE) {
				return reply.data.value;
			}
		}

		return never();
	}

	async set<K extends Extract<keyof T, Key>>(name: K, value: T[K]): Promise<void> {
		return this.#set('values', name, value);
	}

	async #set(bucket: Bucket, name: Key, value: any): Promise<void> {
		const message = protocol.publish({
			type: MessageType.SET_REQUEST,
			context: this.#id,
			bucket,
			name,
			value
		});

		for await (const reply of message.replies()) {
			if (reply.data.type === MessageType.SET_RESPONSE) {
				return;
			}
		}

		return never();
	}

	async task(name: string, exec: () => PromiseLike<void>) {
		await this.#initCooperate();
		const lock = new Lock(this.#cooperateContext, name);
		const semaphore = new UnmanagedSemaphore(this.#cooperateContext, name, 1);
		const release = await lock.acquire();
		const shouldExecuteOperation = await semaphore.downNow(1).then(() => true, () => false);
		try {
			if (shouldExecuteOperation) {
				const result: TaskResult = { error: null };
				try {
					await exec();
				} catch (e) {
					result.error = `${e}`;
					throw e;
				} finally {
					this.#set('taskResults', name, result);
				}
			} else {
				// Read result from shared data store
				const result: TaskResult = await this.#get('taskResults', name);
				if (result.error) throw result.error;
			}
		} finally {
			release();
		}
	}
}
