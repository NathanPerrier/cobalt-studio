import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class CobaltReply implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Reply',
		name: 'cobaltReply',
		icon: 'fa:comment',
		group: ['transform'],
		version: 1,
		description: 'Send a reply back to the Cobalt chat user',
		defaults: {
			name: 'Cobalt Reply',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				placeholder: 'Hello there!',
				description: 'The message to send back to the user',
			},
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				default: '={{$json.sessionId}}',
				description: 'The session ID of the user',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const message = this.getNodeParameter('message', i) as string;
			let sessionId: string | undefined;

			try {
				sessionId = this.getNodeParameter('sessionId', i) as string;
			} catch (e) {
				// Ignore error if parameter resolution fails initially
			}

			if (!sessionId) {
				// Fallback: Try to find sessionId from Cobalt Trigger using .first() which is more robust for AI Agent chains
				try {
					// We use a hardcoded check for the default trigger name as a convenience fallback
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
				const error = new Error(
					'Session ID is missing. If you are using an AI Agent node, the session ID might have been lost. Please map the "Session ID" field to the "Cobalt Trigger" node using an expression like {{ $("Cobalt Trigger").first().json.sessionId }}. Note: Use .first() instead of .item if the AI Agent breaks the item pairing.',
				);
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}

			const body = {
				sessionId,
				type: 'text',
				content: message,
			};

			try {
				await this.helpers.request({
					method: 'POST',
					uri: 'http://localhost:3000/api/internal/message',
					body,
					json: true,
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				if (this.continueOnFail()) {
					returnData.push({ json: { error: errorMessage } });
					continue;
				}
				throw error;
			}

			returnData.push({
				json: {
					message,
					sessionId,
					sent: true,
				},
			});
		}

		return [returnData];
	}
}
