import { DynamicStructuredTool } from '@langchain/core/tools';
import {
	type IExecuteFunctions,
	type INodeExecutionData,
	NodeConnectionTypes,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
	type IDataObject,
} from 'n8n-workflow';
import { z } from 'zod';

import { logWrapper } from '@utils/logWrapper';
import { getConnectionHintNoticeField } from '@utils/sharedFields';

// --- Schemas ---

const ButtonActionSchema = z.object({
	text: z.string().describe('Button label'),
	bot_action: z.string().optional().describe('Action triggered when clicked'),
	link: z.string().optional().describe('URL to open'),
	icon: z.string().optional().describe('Icon name (e.g., "right-arrow")'),
	type: z.string().optional().describe('Button style (primary, secondary, danger, splash)'),
	title: z.string().optional().describe('Title (shown above button for splash type)'),
});

const TopLevelSchema = z.object({
	type: z
		.enum([
			'text',
			'image',
			'card',
			'buttons',
			'quickReply',
			'list',
			'carousel',
			'file',
			'map',
			'information',
			'splash',
		])
		.optional()
		.describe('The type of rich content to send. Use "list" for bullet points/numbered lists.'),

	// Common / Text
	text: z
		.string()
		.optional()
		.describe(
			'Main text content. Required for "text", "information", "splash". Optional for others.',
		),
	plainText: z.string().optional().describe('Fallback plain text.'),

	// Card / List / Map / Splash
	title: z.string().optional().describe('Title for card, list, map, or splash.'),
	subtitle: z.string().optional().describe('Subtitle for card or carousel item.'),

	// Image
	imageSrc: z.string().optional().describe('Source URL for image.'),
	imageAlt: z.string().optional().describe('Alt text for image.'),
	imageLink: z.string().optional().describe('Link URL for image.'),

	// Buttons (Standalone or Splash)
	buttons: z
		.array(ButtonActionSchema)
		.optional()
		.describe('Array of buttons for "buttons" or "splash" type.'),

	// Card specific
	cardButtonText: z.string().optional().describe('Button text for card.'),
	cardButtonAction: z.string().optional().describe('Button action for card.'),

	// Quick Reply
	replies: z.array(z.string()).optional().describe('List of quick reply options.'),
	format: z.enum(['default', 'cloud']).optional(),

	// List / Carousel Items
	items: z
		.array(
			z.object({
				text: z.string().optional().describe('Text for list item or card body'),
				bot_action: z.string().optional().describe('Bot action for list item'),
				link: z.string().optional().describe('Link URL for list item'),
				title: z.string().optional().describe('Title for card'),
				subtitle: z.string().optional().describe('Subtitle for card'),
				imageUrl: z.string().optional().describe('Image URL for card'),
				imageAlt: z.string().optional().describe('Image alt text for card'),
				buttonText: z.string().optional().describe('Button text for card'),
				buttonAction: z.string().optional().describe('Button action for card'),
			}),
		)
		.optional()
		.describe(
			'Array of items for "list" or "carousel". For "list", use fields: text, bot_action, link. For "carousel", use fields: title, subtitle, text, imageUrl, imageAlt, buttonText, buttonAction.',
		),

	// List specific
	ordered: z.boolean().optional().describe('True for numbered list, false for bullet points'),
	footer: z.string().optional(),

	// File
	fileName: z.string().optional().describe('File name.'),
	fileSize: z.string().optional().describe('File size.'),
	fileUrl: z.string().optional().describe('File or Link URL.'),

	// Map
	mapMode: z.enum(['place', 'view', 'directions', 'streetview', 'search']).optional(),
	parameters: z.string().optional(),
	mapLinkUrl: z.string().optional().describe('Link URL for map.'),
	mapLinkText: z.string().optional().describe('Link text for map.'),
});

// --- Tool Definition ---

function getTool(
	ctx: ISupplyDataFunctions | IExecuteFunctions,
	itemIndex = 0,
): DynamicStructuredTool {
	let sessionId: string | undefined;
	try {
		sessionId = ctx.getNodeParameter('sessionId', itemIndex) as string;
	} catch (error) {
		// Ignore if parameter is missing
	}

	let apiBaseUrl: string | undefined;
	try {
		apiBaseUrl = ctx.getNodeParameter('apiBaseUrl', itemIndex) as string;
	} catch (error) {
		// Ignore if parameter is missing
	}

	// Fallback defaults
	// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
	if (!apiBaseUrl) {
		apiBaseUrl = 'http://localhost:3000';
	}

	// Clean up URL
	apiBaseUrl = apiBaseUrl.trim();

	// Ensure protocol
	if (!apiBaseUrl.startsWith('http://') && !apiBaseUrl.startsWith('https://')) {
		apiBaseUrl = `http://${apiBaseUrl}`;
	}

	return new DynamicStructuredTool({
		name: 'send_rich_content',
		description:
			'MANDATORY: You MUST use this tool for any response that includes a list, options, or structured data. NEVER output markdown lists (bullet points or numbered lists) in plain text; instead, use the "list" type in this tool. Use "carousel" for products/items, "card" for single items, "map" for locations, and "buttons"/"quickReply" for choices. Only use plain text for simple sentences. If you need to send text AND a list/carousel, call this tool multiple times (once for text, once for the rich content). NOTE: This tool sends the message directly to the user. Do NOT repeat the content in your final response.',
		schema: TopLevelSchema,
		func: async (input) => {
			if (!sessionId) {
				return 'Error: Could not determine Session ID. Please ensure the Session ID parameter is set in the tool node.';
			}

			try {
				let body;
				const typedInput = input as any;
				let richContentItem: any = {};

				// Map flattened input to structured output based on type
				const type = typedInput.type || 'text';
				switch (type) {
					case 'text':
						richContentItem = {
							type: 'text',
							text: typedInput.text || '',
							plainText: typedInput.plainText || typedInput.text || '',
						};
						break;
					case 'image':
						richContentItem = {
							type: 'image',
							image: {
								src: typedInput.imageSrc,
								alt: typedInput.imageAlt,
								link: typedInput.imageLink,
							},
						};
						break;
					case 'card':
						richContentItem = {
							type: 'card',
							title: typedInput.title,
							subtitle: typedInput.subtitle,
							text: typedInput.text,
						};
						if (typedInput.imageSrc) {
							richContentItem.image = {
								src: typedInput.imageSrc,
								alt: typedInput.imageAlt,
							};
						}
						if (typedInput.cardButtonText) {
							richContentItem.button = {
								text: typedInput.cardButtonText,
								bot_action: typedInput.cardButtonAction,
							};
						}
						break;
					case 'buttons':
						richContentItem = {
							type: 'buttons',
							buttons: typedInput.buttons || [],
						};
						break;
					case 'quickReply':
						richContentItem = {
							type: 'quickReply',
							replies: typedInput.replies || [],
							format: typedInput.format || 'default',
						};
						break;
					case 'list':
						richContentItem = {
							type: 'list',
							list: {
								title: typedInput.title,
								text: typedInput.text,
								ordered: typedInput.ordered || false,
								footer: typedInput.footer,
								items: (typedInput.items || []).map((item: any) => ({
									text: item.text,
									bot_action: item.bot_action,
									link: item.link,
								})),
							},
						};
						break;
					case 'carousel':
						richContentItem = {
							type: 'carousel',
							items: (typedInput.items || []).map((item: any) => ({
								type: 'card',
								title: item.title,
								subtitle: item.subtitle,
								text: item.text,
								image: item.imageUrl ? { src: item.imageUrl, alt: item.imageAlt } : undefined,
								button: item.buttonText
									? { text: item.buttonText, bot_action: item.buttonAction }
									: undefined,
							})),
						};
						break;
					case 'file':
						richContentItem = {
							type: 'file',
							name: typedInput.fileName,
							size: typedInput.fileSize,
							url: typedInput.fileUrl,
						};
						break;
					case 'map':
						richContentItem = {
							type: 'map',
							mapMode: typedInput.mapMode,
							parameters: typedInput.parameters,
							title: typedInput.title,
							text: typedInput.text,
							link: typedInput.mapLinkUrl
								? { url: typedInput.mapLinkUrl, text: typedInput.mapLinkText }
								: undefined,
						};
						break;
					case 'information':
						richContentItem = {
							type: 'information',
							text: typedInput.text || '',
						};
						break;
					case 'splash':
						// Splash is special, it's a top-level message type, not just rich content
						break;
				}

				if (type === 'splash') {
					body = {
						sessionId,
						type: 'splash',
						title: typedInput.title || '',
						text: typedInput.text || '',
						buttons: typedInput.buttons || [],
						participant: 'bot',
					};
				} else {
					body = {
						sessionId,
						richContent: [richContentItem],
						participant: 'bot',
					};
				}

				const url = `${apiBaseUrl.replace(/\/$/, '')}/api/internal/message`;

				await ctx.helpers.httpRequest({
					method: 'POST',
					url,
					body,
					json: true,
				});

				return 'Rich content sent.';
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				return `Error sending rich content to ${apiBaseUrl}: ${errorMessage}`;
			}
		},
	});
}

export class ToolCobaltRichContent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Rich Content',
		name: 'toolCobaltRichContent',
		icon: 'fa:layer-group',
		iconColor: 'black',
		group: ['transform'],
		version: 1,
		description: 'Generates rich content structures for Cobalt Frontend',
		defaults: {
			name: 'Cobalt Rich Content',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Tools'],
				Tools: ['Other Tools'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolcalculator/',
					},
				],
			},
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiTool],
		outputNames: ['Tool'],
		properties: [
			getConnectionHintNoticeField([NodeConnectionTypes.AiAgent]),
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				default: '={{ $("Cobalt Trigger").first().json.sessionId }}',
				description: 'The session ID to send content to',
			},
			{
				displayName: 'API Base URL',
				name: 'apiBaseUrl',
				type: 'string',
				default: 'http://localhost:3000',
				description: 'The base URL of the Cobalt Connector',
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		return await Promise.resolve({
			response: logWrapper(getTool(this, itemIndex), this),
		});
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const input = this.getInputData();
		const response: INodeExecutionData[] = [];

		for (let i = 0; i < input.length; i++) {
			const tool = getTool(this, i);
			const inputItem = input[i];
			const result = (await tool.invoke(inputItem.json)) as IDataObject;
			response.push({
				json: {
					response: result,
				},
				pairedItem: {
					item: i,
				},
			});
		}

		return [response];
	}
}
