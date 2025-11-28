import { IWebhookFunctions } from 'n8n-workflow';

import { INodeType, INodeTypeDescription, IWebhookResponseData } from 'n8n-workflow';

export class CobaltTimeoutTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Timeout Trigger',
		name: 'cobaltTimeoutTrigger',
		icon: 'fa:bolt',
		group: ['trigger'],
		version: 1,
		description: 'Starts a workflow when a session times out',
		defaults: {
			name: 'Cobalt Timeout Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'timeout',
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
