import { IWebhookFunctions } from 'n8n-workflow';

import { INodeType, INodeTypeDescription, IWebhookResponseData } from 'n8n-workflow';

export class CobaltEndChatTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt End Chat Trigger',
		name: 'cobaltEndChatTrigger',
		icon: 'fa:bolt',
		group: ['trigger'],
		version: 1,
		description: 'Starts a workflow when the chat is ended',
		defaults: {
			name: 'Cobalt End Chat Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'end-chat',
			},
		],
		properties: [],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();

		return {
			workflowData: [
				[
					{
						json: bodyData,
					},
				],
			],
		};
	}
}
