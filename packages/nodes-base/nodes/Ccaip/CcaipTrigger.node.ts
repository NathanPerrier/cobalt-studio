import type {
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';

export class CcaipTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CCAIP Trigger',
		name: 'ccaipTrigger',
		icon: 'fa:bolt',
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when an event is received from CCAIP',
		defaults: {
			name: 'CCAIP Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'ccaip-listener',
			},
		],
		properties: [],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const headerData = this.getHeaderData();
		const queryData = this.getQueryData();

		return {
			workflowData: [
				[
					{
						json: {
							body: bodyData,
							headers: headerData,
							query: queryData,
						},
					},
				],
			],
		};
	}
}
