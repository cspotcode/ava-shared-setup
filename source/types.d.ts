interface TaskResult {
	error: string | null;
}

export const enum MessageType {
	SET_REQUEST = 10,
	SET_RESPONSE = 11,
	GET_REQUEST = 12,
	GET_RESPONSE = 13,
}

export type Key = string | number;
export type Buckets = {
	values: Map<Key, any>;
	taskResults: Map<Key, TaskResult>;
}
export type Bucket = keyof Buckets;


export type SetRequest = {
	type: MessageType.SET_REQUEST;
	context: string;
	bucket: Bucket;
	name: Key;
	value: any;
};

export type SetResponse = {
	type: MessageType.SET_RESPONSE;
};

export type GetRequest = {
	type: MessageType.GET_REQUEST;
	context: string;
	bucket: Bucket;
	name: Key;
};

export type GetResponse = {
	type: MessageType.GET_RESPONSE;
	value: any;
};

export type Data = SetRequest | SetResponse | GetRequest | GetResponse;
