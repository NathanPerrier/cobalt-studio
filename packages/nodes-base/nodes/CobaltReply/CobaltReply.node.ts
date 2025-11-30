import type {
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
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				default: '={{$json.sessionId}}',
				description: 'The session ID of the user',
			},
			{
				displayName: 'Content',
				name: 'content',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				options: [
					{
						name: 'item',
						displayName: 'Item',
						values: [
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{ name: 'Text', value: 'text' },
									{ name: 'Image', value: 'image' },
									{ name: 'Card', value: 'card' },
									{ name: 'Buttons', value: 'buttons' },
									{ name: 'Quick Reply', value: 'quickReply' },
									{ name: 'List', value: 'list' },
									{ name: 'Carousel', value: 'carousel' },
									{ name: 'File', value: 'file' },
									{ name: 'Map', value: 'map' },
									{ name: 'Information', value: 'information' },
								],
								default: 'text',
							},
							// TEXT
							{
								displayName: 'Message',
								name: 'message',
								type: 'string',
								displayOptions: { show: { type: ['text'] } },
								default: '',
								placeholder: 'Hello there!',
							},
							// IMAGE
							{
								displayName: 'Source URL',
								name: 'imageSrc',
								type: 'string',
								displayOptions: { show: { type: ['image'] } },
								default: '',
							},
							{
								displayName: 'Alt Text',
								name: 'imageAlt',
								type: 'string',
								displayOptions: { show: { type: ['image'] } },
								default: '',
							},
							{
								displayName: 'Link URL',
								name: 'imageLink',
								type: 'string',
								displayOptions: { show: { type: ['image'] } },
								default: '',
							},
							// CARD
							{
								displayName: 'Title',
								name: 'cardTitle',
								type: 'string',
								displayOptions: { show: { type: ['card'] } },
								default: '',
							},
							{
								displayName: 'Subtitle',
								name: 'cardSubtitle',
								type: 'string',
								displayOptions: { show: { type: ['card'] } },
								default: '',
							},
							{
								displayName: 'Text',
								name: 'cardText',
								type: 'string',
								displayOptions: { show: { type: ['card'] } },
								default: '',
							},
							{
								displayName: 'Image URL',
								name: 'cardImageUrl',
								type: 'string',
								displayOptions: { show: { type: ['card'] } },
								default: '',
							},
							{
								displayName: 'Image Alt',
								name: 'cardImageAlt',
								type: 'string',
								displayOptions: { show: { type: ['card'] } },
								default: '',
							},
							{
								displayName: 'Button Text',
								name: 'cardButtonText',
								type: 'string',
								displayOptions: { show: { type: ['card'] } },
								default: '',
							},
							{
								displayName: 'Button Action',
								name: 'cardButtonAction',
								type: 'string',
								displayOptions: { show: { type: ['card'] } },
								default: '',
							},
							// BUTTONS
							{
								displayName: 'Buttons',
								name: 'buttons',
								type: 'fixedCollection',
								displayOptions: { show: { type: ['buttons'] } },
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'button',
										displayName: 'Button',
										values: [
											{ displayName: 'Text', name: 'text', type: 'string', default: '' },
											{
												displayName: 'Bot Action',
												name: 'bot_action',
												type: 'string',
												default: '',
											},
											{ displayName: 'Link', name: 'link', type: 'string', default: '' },
											{ displayName: 'Icon', name: 'icon', type: 'string', default: '' },
										],
									},
								],
							},
							// QUICK REPLY
							{
								displayName: 'Format',
								name: 'quickReplyFormat',
								type: 'options',
								displayOptions: { show: { type: ['quickReply'] } },
								options: [
									{ name: 'Default', value: 'default' },
									{ name: 'Cloud', value: 'cloud' },
								],
								default: 'default',
							},
							{
								displayName: 'Replies',
								name: 'quickReplies',
								type: 'fixedCollection',
								displayOptions: { show: { type: ['quickReply'] } },
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'reply',
										displayName: 'Reply',
										values: [{ displayName: 'Text', name: 'text', type: 'string', default: '' }],
									},
								],
							},
							// LIST
							{
								displayName: 'Title',
								name: 'listTitle',
								type: 'string',
								displayOptions: { show: { type: ['list'] } },
								default: '',
							},
							{
								displayName: 'Text',
								name: 'listText',
								type: 'string',
								displayOptions: { show: { type: ['list'] } },
								default: '',
							},
							{
								displayName: 'Ordered',
								name: 'listOrdered',
								type: 'boolean',
								displayOptions: { show: { type: ['list'] } },
								default: false,
							},
							{
								displayName: 'Footer',
								name: 'listFooter',
								type: 'string',
								displayOptions: { show: { type: ['list'] } },
								default: '',
							},
							{
								displayName: 'Items',
								name: 'listItems',
								type: 'fixedCollection',
								displayOptions: { show: { type: ['list'] } },
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'item',
										displayName: 'Item',
										values: [
											{ displayName: 'Text', name: 'text', type: 'string', default: '' },
											{
												displayName: 'Bot Action',
												name: 'bot_action',
												type: 'string',
												default: '',
											},
											{ displayName: 'Link', name: 'link', type: 'string', default: '' },
										],
									},
								],
							},
							// CAROUSEL
							{
								displayName: 'Cards',
								name: 'carouselItems',
								type: 'fixedCollection',
								displayOptions: { show: { type: ['carousel'] } },
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'card',
										displayName: 'Card',
										values: [
											{ displayName: 'Title', name: 'title', type: 'string', default: '' },
											{ displayName: 'Subtitle', name: 'subtitle', type: 'string', default: '' },
											{ displayName: 'Text', name: 'text', type: 'string', default: '' },
											{ displayName: 'Image URL', name: 'imageUrl', type: 'string', default: '' },
											{ displayName: 'Image Alt', name: 'imageAlt', type: 'string', default: '' },
											{
												displayName: 'Button Text',
												name: 'buttonText',
												type: 'string',
												default: '',
											},
											{
												displayName: 'Button Action',
												name: 'buttonAction',
												type: 'string',
												default: '',
											},
										],
									},
								],
							},
							// FILE
							{
								displayName: 'File Name',
								name: 'fileName',
								type: 'string',
								displayOptions: { show: { type: ['file'] } },
								default: '',
							},
							{
								displayName: 'File Size',
								name: 'fileSize',
								type: 'string',
								displayOptions: { show: { type: ['file'] } },
								default: '',
								placeholder: 'e.g. 2MB',
							},
							{
								displayName: 'File URL',
								name: 'fileUrl',
								type: 'string',
								displayOptions: { show: { type: ['file'] } },
								default: '',
							},
							// MAP
							{
								displayName: 'Map Mode',
								name: 'mapMode',
								type: 'options',
								options: [
									{ name: 'Place', value: 'place' },
									{ name: 'View', value: 'view' },
									{ name: 'Directions', value: 'directions' },
									{ name: 'Street View', value: 'streetview' },
									{ name: 'Search', value: 'search' },
								],
								displayOptions: { show: { type: ['map'] } },
								default: 'place',
							},
							{
								displayName: 'Parameters',
								name: 'mapParameters',
								type: 'string',
								displayOptions: { show: { type: ['map'] } },
								default: '',
								description: 'Google Maps Embed API parameters (e.g. &q=Eiffel+Tower)',
							},
							{
								displayName: 'Title',
								name: 'mapTitle',
								type: 'string',
								displayOptions: { show: { type: ['map'] } },
								default: '',
							},
							{
								displayName: 'Text',
								name: 'mapText',
								type: 'string',
								displayOptions: { show: { type: ['map'] } },
								default: '',
							},
							{
								displayName: 'Link URL',
								name: 'mapLinkUrl',
								type: 'string',
								displayOptions: { show: { type: ['map'] } },
								default: '',
							},
							{
								displayName: 'Link Text',
								name: 'mapLinkText',
								type: 'string',
								displayOptions: { show: { type: ['map'] } },
								default: '',
							},
							// INFORMATION
							{
								displayName: 'Text',
								name: 'infoText',
								type: 'string',
								displayOptions: { show: { type: ['information'] } },
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'collection',
				placeholder: 'Add Metadata',
				default: {},
				options: [
					{
						displayName: 'Chat Ended',
						name: 'chatEnded',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Agent Typing',
						name: 'agentTyping',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Email Transcript Requested',
						name: 'emailRequested',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Email Transcript Sent',
						name: 'emailSent',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Get Location',
						name: 'getLocation',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Apple Pay',
						name: 'applePay',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Start Survey',
						name: 'startSurvey',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Live Agent In Queue',
						name: 'liveAgentInQueue',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Lock Input',
						name: 'lockInput',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Live Agent Unavailable',
						name: 'liveAgentUnavailable',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Live Agent Requested',
						name: 'liveAgentRequested',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Livechat Issue',
						name: 'livechatIssue',
						type: 'boolean',
						default: false,
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			let sessionId: string | undefined;
			try {
				sessionId = this.getNodeParameter('sessionId', i) as string;
			} catch (e) {}

			if (!sessionId) {
				try {
					const triggerSessionId = this.getNodeParameter(
						'={{ $("Cobalt Trigger").first().json.sessionId }}',
						i,
					) as string;
					if (triggerSessionId) sessionId = triggerSessionId;
				} catch (e) {}
			}

			if (!sessionId) {
				const inputSessionId = items[i].json.sessionId as string;
				if (inputSessionId) sessionId = inputSessionId;
			}

			const contentData = this.getNodeParameter('content', i) as { item: any[] };
			let richContent: any[] = [];
			let plainText = '';
			const debugInfo: any[] = [];

			const contentItems = contentData.item || [];

			for (const item of contentItems) {
				debugInfo.push(item);
				const type = item.type;
				if (type === 'text') {
					richContent.push({
						type: 'text',
						plainText: item.message,
						text: item.message,
					});
					if (!plainText) plainText = item.message;
				} else if (type === 'image') {
					richContent.push({
						type: 'image',
						image: {
							src: item.src,
							alt: item.alt,
							link: item.link,
						},
					});
				} else if (type === 'card') {
					const card: any = {
						type: 'card',
						title: item.title,
						subtitle: item.subtitle,
						text: item.text,
					};
					if (item.imageUrl) card.image = { src: item.imageUrl, alt: item.imageAlt };
					if (item.buttonText)
						card.button = { text: item.buttonText, bot_action: item.buttonAction };
					richContent.push(card);
				} else if (type === 'buttons') {
					const btns = (item.buttons?.button || []).map((b: any) => ({
						text: b.text,
						bot_action: b.bot_action,
						link: b.link,
						icon: b.icon,
					}));
					if (btns.length) {
						richContent.push({ type: 'buttons', buttons: btns });
					}
				} else if (type === 'quickReply') {
					const replies = (item.quickReplies?.reply || []).map((r: any) => r.text);
					if (replies.length) {
						richContent.push({
							type: 'quickReply',
							replies,
							format: item.quickReplyFormat,
						});
					}
				} else if (type === 'list') {
					const listItems = (item.listItems?.item || []).map((li: any) => ({
						text: li.text,
						bot_action: li.bot_action,
						link: li.link,
					}));
					richContent.push({
						type: 'list',
						list: {
							title: item.listTitle,
							text: item.listText,
							ordered: item.listOrdered,
							footer: item.listFooter,
							items: listItems,
						},
					});
				} else if (type === 'carousel') {
					const cards = (item.carouselItems?.card || []).map((c: any) => ({
						type: 'card',
						title: c.title,
						subtitle: c.subtitle,
						text: c.text,
						image: c.imageUrl ? { src: c.imageUrl, alt: c.imageAlt } : undefined,
						button: c.buttonText ? { text: c.buttonText, bot_action: c.buttonAction } : undefined,
					}));
					if (cards.length) {
						richContent.push({ type: 'carousel', items: cards });
					}
				} else if (type === 'file') {
					richContent.push({
						type: 'file',
						name: item.fileName,
						size: item.fileSize,
						url: item.fileUrl,
					});
				} else if (type === 'map') {
					richContent.push({
						type: 'map',
						mapMode: item.mapMode,
						parameters: item.mapParameters,
						title: item.mapTitle,
						text: item.mapText,
						link: item.mapLinkUrl ? { url: item.mapLinkUrl, text: item.mapLinkText } : undefined,
					});
				} else if (type === 'information') {
					richContent.push({
						type: 'information',
						text: item.infoText,
					});
				}
			}

			const metadata = this.getNodeParameter('metadata', i) as {
				chatEnded?: boolean;
				startSurvey?: boolean;
				liveAgentRequested?: boolean;
				lockInput?: boolean;
				liveAgentUnavailable?: boolean;
				livechatIssue?: boolean;
				getLocation?: boolean;
				emailRequested?: boolean;
				emailSent?: boolean;
				agentTyping?: boolean;
				applePay?: boolean;
			};

			const body = {
				sessionId,
				type: 'text',
				plainText: plainText || 'Rich Content',
				richContent,
				meta: metadata,
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
				returnData.push({ json: { error: errorMessage, body } });
				continue;
			}

			returnData.push({
				json: {
					...body,
					sent: true,
				},
			});
		}

		return [returnData];
	}
}
