import {SharedWorker} from 'ava/plugin';

import {
	Buckets,
	Data,
	GetRequest,
	MessageType,
	SetRequest,
} from './types.js';

type ReceivedMessage = SharedWorker.ReceivedMessage<Data>;

const factory: SharedWorker.Factory = async ({negotiateProtocol}) => {
	const protocol = negotiateProtocol<Data>(['ava-4']).ready();

	const values = new Map<string, Buckets>();

	for await (const message of protocol.subscribe()) {
		const {data} = message;
		switch (data.type) {
			case MessageType.GET_REQUEST: {
				void getValue(message, data);
				break;
			}

			case MessageType.SET_REQUEST: {
				void setValue(message, data);
				break;
			}

			// No default
			default:
				continue;
		}
	}

	function getContext(context: string) {
		if(values.has(context)) {
			return values.get(context)!;
		}
		const contextBuckets: Buckets = {
			values: new Map(),
			taskResults: new Map(),
		};
		values.set(context, contextBuckets);
		return contextBuckets;
	}

	async function getValue(message: ReceivedMessage, data: GetRequest): Promise<void> {
		message.reply({
			type: MessageType.GET_RESPONSE,
			value: getContext(data.context)[data.bucket].get(data.name)
		});
	}

	async function setValue(message: ReceivedMessage, data: SetRequest): Promise<void> {
		getContext(data.context)[data.bucket].set(data.name, data.value);
		message.reply({
			type: MessageType.SET_RESPONSE,
		});
	}
};

export default factory;

