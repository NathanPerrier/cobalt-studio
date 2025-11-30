import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class Ccaip implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CCAIP',
		name: 'ccaip',
		icon: 'fa:comments',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume CCAIP API',
		defaults: {
			name: 'CCAIP',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'ccaipApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat',
						value: 'chat',
					},
				],
				default: 'chat',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new chat session',
						action: 'Create a chat',
					},
					{
						name: 'End',
						value: 'end',
						description: 'End a chat session',
						action: 'End a chat',
					},
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a message to a chat session',
						action: 'Send a message',
					},
				],
				default: 'create',
			},

			// ----------------------------------
			//         chat:create
			// ----------------------------------
			{
				displayName: 'Menu ID',
				name: 'menuId',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['create'],
					},
				},
				default: 0,
				description: 'ID of the menu',
			},
			{
				displayName: 'End User ID',
				name: 'endUserId',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['create'],
					},
				},
				default: 0,
				description: 'ID of the end user',
			},
			{
				displayName: 'Language',
				name: 'lang',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['create'],
					},
				},
				default: 'en',
				description: 'Language code (e.g. en)',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'user@example.com',
			},
			{
				displayName: 'Context (JSON)',
				name: 'context',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['create'],
					},
				},
				default: '{}',
				description: 'Context object to pass metadata (e.g. cobaltSessionId)',
			},

			// ----------------------------------
			//         chat:sendMessage
			// ----------------------------------
			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['sendMessage', 'end'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'From User ID',
				name: 'fromUserId',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['sendMessage'],
					},
				},
				default: 0,
			},
			{
				displayName: 'Message Type',
				name: 'messageType',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['sendMessage'],
					},
				},
				default: 'text',
			},
			{
				displayName: 'Message Content',
				name: 'messageContent',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['sendMessage'],
					},
				},
				default: '',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		// Get credentials
		const credentials = await this.getCredentials('ccaipApi');
		const subdomain = credentials.subdomain as string;
		const domain = credentials.domain as string;
		const baseUrl = `https://${subdomain}.${domain}/apps/api/v1`;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'chat') {
					if (operation === 'create') {
						const menuId = this.getNodeParameter('menuId', i) as number;
						const endUserId = this.getNodeParameter('endUserId', i) as number;
						const lang = this.getNodeParameter('lang', i) as string;
						const email = this.getNodeParameter('email', i) as string;
						const contextJson = this.getNodeParameter('context', i) as string | object;

						let context = {};
						if (typeof contextJson === 'string') {
							try {
								context = JSON.parse(contextJson);
							} catch (e) {
								// ignore
							}
						} else {
							context = contextJson;
						}

						const body = {
							chat: {
								menu_id: menuId,
								end_user_id: endUserId,
								lang,
								email,
								context,
							},
						};

						const response = await this.helpers.request({
							method: 'POST',
							uri: `${baseUrl}/chats`,
							body,
							json: true,
						});

						returnData.push({ json: response });
					} else if (operation === 'sendMessage') {
						const chatId = this.getNodeParameter('chatId', i) as string;
						const fromUserId = this.getNodeParameter('fromUserId', i) as number;
						const type = this.getNodeParameter('messageType', i) as string;
						const content = this.getNodeParameter('messageContent', i) as string;

						const body = {
							from_user_id: fromUserId,
							message: {
								type,
								content,
							},
						};

						const response = await this.helpers.request({
							method: 'POST',
							uri: `${baseUrl}/chats/${chatId}/message`,
							body,
							json: true,
						});

						returnData.push({ json: response });
					} else if (operation === 'end') {
						const chatId = this.getNodeParameter('chatId', i) as string;

						// Placeholder for End Chat.
						// Assuming DELETE or status update.
						// Implementing as DELETE for now, user can adjust.
						const response = await this.helpers.request({
							method: 'DELETE',
							uri: `${baseUrl}/chats/${chatId}`,
							json: true,
						});

						returnData.push({ json: response });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = {
						json: {
							error: (error as Error).message,
						},
					} as INodeExecutionData;
					returnData.push(executionErrorData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
