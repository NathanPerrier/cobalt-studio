import { IWebhookFunctions } from 'n8n-workflow';

import { INodeType, INodeTypeDescription, IWebhookResponseData } from 'n8n-workflow';

export class CobaltEmailTranscriptTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Email Transcript Trigger',
		name: 'cobaltEmailTranscriptTrigger',
		icon: 'fa:envelope',
		group: ['trigger'],
		version: 1,
		description: 'Starts a workflow when an email transcript is requested',
		defaults: {
			name: 'Cobalt Email Transcript Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'email-transcript',
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
