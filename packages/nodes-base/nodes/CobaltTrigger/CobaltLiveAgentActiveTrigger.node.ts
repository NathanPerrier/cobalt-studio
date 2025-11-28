import { IWebhookFunctions } from 'n8n-workflow';

import { INodeType, INodeTypeDescription, IWebhookResponseData } from 'n8n-workflow';

export class CobaltLiveAgentActiveTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Live Agent Active Trigger',
		name: 'cobaltLiveAgentActiveTrigger',
		icon: 'fa:bolt',
		group: ['trigger'],
		version: 1,
		description:
			'Starts a workflow when a user sends a message during an active live agent session',
		defaults: {
			name: 'Cobalt Live Agent Active Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'live-agent-active',
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
