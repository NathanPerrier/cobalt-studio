import { IWebhookFunctions } from 'n8n-workflow';

import { INodeType, INodeTypeDescription, IWebhookResponseData } from 'n8n-workflow';

export class CobaltGreetingTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Greeting Trigger',
		name: 'cobaltGreetingTrigger',
		icon: 'fa:bolt',
		group: ['trigger'],
		version: 1,
		description: 'Starts a workflow when a greeting is requested',
		defaults: {
			name: 'Cobalt Greeting Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'greeting',
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
