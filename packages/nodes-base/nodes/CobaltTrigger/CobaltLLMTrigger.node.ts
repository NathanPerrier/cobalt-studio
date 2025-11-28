import { IWebhookFunctions } from 'n8n-workflow';

import { INodeType, INodeTypeDescription, IWebhookResponseData } from 'n8n-workflow';

export class CobaltLLMTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt LLM Trigger',
		name: 'cobaltLLMTrigger',
		icon: 'fa:bolt',
		group: ['trigger'],
		version: 1,
		description: 'Starts a workflow when a user message is received for LLM processing',
		defaults: {
			name: 'Cobalt LLM Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'llm',
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
