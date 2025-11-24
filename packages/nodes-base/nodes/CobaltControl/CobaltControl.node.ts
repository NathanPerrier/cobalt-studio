import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class CobaltControl implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Control',
		name: 'cobaltControl',
		icon: 'fa:cogs',
		group: ['transform'],
		version: 1,
		description: 'Control the state of the Cobalt chat session',
		defaults: {
			name: 'Cobalt Control',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Add to Datastore',
						value: 'datastore',
						description: 'Add data to the datastore',
						action: 'Add data to the datastore',
					},
					{
						name: 'End Chat',
						value: 'end',
						description: 'End the current chat session',
						action: 'End the current chat session',
					},
					{
						name: 'Set Agent Mode',
						value: 'agent',
						description: 'Switch the chat to Live Agent mode',
						action: 'Switch the chat to Live Agent mode',
					},
					{
						name: 'Set Bot Mode',
						value: 'bot',
						description: 'Switch the chat to AI Bot mode',
						action: 'Switch the chat to AI Bot mode',
					},
					{
						name: 'Set Live Agent Requested',
						value: 'liveAgentRequested',
						description: 'Flag that a live agent has been requested',
						action: 'Flag that a live agent has been requested',
					},
					{
						name: 'Trigger Email',
						value: 'email',
						description: 'Trigger an email action',
						action: 'Trigger an email action',
					},
				],
				default: 'bot',
			},
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				default: '={{$json.sessionId}}',
				description: 'The session ID of the user',
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['liveAgentRequested'],
					},
				},
				description: 'Whether a live agent is requested or not',
			},
			{
				displayName: 'Payload',
				name: 'payload',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						operation: ['email', 'datastore'],
					},
				},
				description: 'Additional payload for the action',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;
			let sessionId: string | undefined;

			try {
				sessionId = this.getNodeParameter('sessionId', i) as string;
			} catch (e) {
				// Ignore
			}

			if (!sessionId) {
				// Fallback: Try to find sessionId from Cobalt Trigger using .first()
				try {
					const triggerSessionId = this.getNodeParameter(
						'={{ $("Cobalt Trigger").first().json.sessionId }}',
						i,
					) as string;
					if (triggerSessionId) {
						sessionId = triggerSessionId;
					}
				} catch (e) {
					// Ignore
				}
			}

			if (!sessionId) {
				const error = new Error('Session ID is missing.');
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}

			let body: Record<string, unknown> = { sessionId };
			if (operation === 'email' || operation === 'datastore') {
				const payload = this.getNodeParameter('payload', i) as object;
				body = { ...body, payload };
			} else if (operation === 'liveAgentRequested') {
				// Map to datastore operation with specific payload
				const value = this.getNodeParameter('value', i) as boolean;
				const payload = { liveAgentRequested: value };
				body = { ...body, payload };
			}

			const uri =
				operation === 'liveAgentRequested'
					? `http://localhost:3000/api/state/datastore`
					: `http://localhost:3000/api/state/${operation}`;

			try {
				const response = (await this.helpers.request({
					method: 'POST',
					uri,
					body,
					json: true,
				})) as IDataObject;
				returnData.push({ json: response });
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				if (this.continueOnFail()) {
					returnData.push({ json: { error: errorMessage } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
