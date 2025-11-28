import { IWebhookFunctions } from 'n8n-workflow';

import { INodeType, INodeTypeDescription, IWebhookResponseData } from 'n8n-workflow';

export class CobaltAnalyticsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Analytics Trigger',
		name: 'cobaltAnalyticsTrigger',
		icon: 'fa:bolt',
		group: ['trigger'],
		version: 1,
		description: 'Starts a workflow when analytics data (e.g. survey) is submitted',
		defaults: {
			name: 'Cobalt Analytics Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'analytics',
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
