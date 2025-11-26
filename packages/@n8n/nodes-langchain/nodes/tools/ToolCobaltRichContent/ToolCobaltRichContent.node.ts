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

const LinkSchema = z.object({
	url: z.string().describe('The URL to link to'),
	text: z.string().optional().describe('The text to display for the link'),
});

const ButtonSchema = z.object({
	text: z.string().describe('The text on the button'),
	bot_action: z.string().describe('The action to send back to the bot when clicked'),
});

const ImageSchema = z.object({
	src: z.string().describe('The source URL of the image'),
	alt: z.string().describe('The alt text for the image'),
});

const TopLevelSchema = z.object({
	type: z
		.string()
		.describe(
			'The type of rich content to send (card, carousel, list, map, quickReply, flightcard, rideshare, table)',
		),

	// Common/Card fields
	title: z.string().optional().describe('Title for card, list, map, etc.'),
	subtitle: z.string().optional().describe('Subtitle for card'),
	text: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.describe('Text content (string) or array of text lines'),
	image: ImageSchema.optional().describe('Image for card'),
	link: LinkSchema.optional().describe('Link for card or map'),
	button: ButtonSchema.optional().describe('Button for card'),
	className: z.string().optional(),

	// List fields
	ordered: z.boolean().optional(),
	items: z
		.array(z.record(z.any()))
		.optional()
		.describe('Items for Carousel (Cards/Maps) or List (ListItem objects)'),
	footer: z.string().optional(),

	// Map fields
	mapMode: z.string().optional().describe('Map mode (place, view, directions, streetview, search)'),
	parameters: z.string().optional().describe('Map parameters'),

	// Quick Reply fields
	replies: z.array(z.string()).optional().describe('Quick replies'),
	format: z.string().optional(),

	// Flight/Rideshare fields
	layout: z.string().optional(),
	date: z.string().optional(),
	depart: z.record(z.any()).optional(),
	arrive: z.record(z.any()).optional(),
	price: z.union([z.string(), z.number()]).optional(),
	name: z.string().optional(),
	departure: z.string().optional(),
	destination: z.string().optional(),
	options: z.array(z.record(z.any())).optional(),

	// Table fields
	data: z
		.object({
			headers: z.array(z.string()).describe('Array of column headers'),
		})
		.catchall(z.array(z.union([z.string(), z.number()])))
		.optional()
		.describe(
			'Table data object. Must contain "headers" array, and other keys matching headers with arrays of values.',
		),
	selectable: z.boolean().optional().describe('Whether table rows are selectable'),

	// Fallback for nested content
	content: z.record(z.any()).optional().describe('Fallback for nested content'),
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
			'ESSENTIAL: Use this tool WHENEVER possible to display information in a structured, visual format. Do NOT use plain text for lists, options, products, flights, or locations. ALWAYS use this tool for: 1. Presenting multiple options (Carousel/List). 2. Showing product/item details (Card). 3. Displaying locations (Map). 4. Asking for user selection (Quick Replies). Prefer rich content over text responses.',
		schema: TopLevelSchema,
		func: async (input) => {
			if (!sessionId) {
				return 'Error: Could not determine Session ID. Please ensure the Session ID parameter is set in the tool node.';
			}

			// Handle potential nested content from LLM hallucination
			const finalInput = (input as IDataObject).content
				? ((input as IDataObject).content as IDataObject)
				: (input as IDataObject);

			try {
				const body = {
					sessionId,
					richContent: [finalInput],
					participant: 'bot',
				};

				const url = `${apiBaseUrl.replace(/\/$/, '')}/api/internal/message`;

				await ctx.helpers.httpRequest({
					method: 'POST',
					url,
					body,
					json: true,
				});

				return 'Rich content sent successfully to the user.';
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
