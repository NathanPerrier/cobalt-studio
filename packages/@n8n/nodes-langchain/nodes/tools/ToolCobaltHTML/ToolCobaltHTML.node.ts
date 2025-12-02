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

const HtmlSchema = z.object({
	html: z
		.string()
		.describe(
			'The raw HTML content to send. You MUST use valid HTML tags for formatting (e.g., <b>bold</b>, <ul><li>item</li></ul>). Do NOT use Markdown (e.g., **bold**, - item). Supported tags: <table>, <thead>, <tbody>, <tr>, <th>, <td>, <b>, <strong>, <i>, <em>, <u>, <br>, <p>, <h1>-<h6>, <ul>, <ol>, <li>, <a>, <span>, <div>.',
		),
});

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
		name: 'send_html_content',
		description:
			'Use this tool to send messages formatted with HTML. You must convert any Markdown to valid HTML before sending. Useful for tables, bold text, headers, and other formatting. Do NOT use this for simple text messages.',
		schema: HtmlSchema,
		func: async (input) => {
			if (!sessionId) {
				return 'Error: Could not determine Session ID. Please ensure the Session ID parameter is set in the tool node.';
			}

			try {
				const body = {
					sessionId,
					type: 'text', // We use 'text' type because the frontend renders text with v-html
					text: input.html,
					plainText: input.html.replace(/<[^>]*>?/gm, ''), // Strip HTML for plain text fallback
					richContent: [],
					participant: 'bot',
				};

				const url = `${apiBaseUrl.replace(/\/$/, '')}/api/internal/message`;

				await ctx.helpers.httpRequest({
					method: 'POST',
					url,
					body,
					json: true,
				});

				return 'HTML content sent successfully to the user.';
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				return `Error sending HTML content to ${apiBaseUrl}: ${errorMessage}`;
			}
		},
	});
}

export class ToolCobaltHTML implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt HTML Content',
		name: 'toolCobaltHTML',
		icon: 'fa:code',
		iconColor: 'black',
		group: ['transform'],
		version: 1,
		description: 'Generates HTML content for Cobalt Frontend',
		defaults: {
			name: 'Cobalt HTML Content',
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
