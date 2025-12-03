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

const EscalationSchema = z.object({
	reason: z.string().optional().describe('The reason for escalating to a live agent.'),
	text: z
		.string()
		.optional()
		.describe(
			'The text to display to the user (e.g. "Connecting you to a live agent..."). This will be sent as the bot response.',
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
		name: 'escalate_to_live_agent',
		description:
			'Use this tool when the user explicitly requests a live agent or human support. This will trigger the handoff process. You can provide the "text" to show the user.',
		schema: EscalationSchema,
		func: async (input) => {
			if (!sessionId) {
				return 'Error: Could not determine Session ID. Please ensure the Session ID parameter is set in the tool node.';
			}

			try {
				const body = {
					sessionId,
					content: input.text || 'Connecting you to a live agent...',
					meta: {
						liveAgentRequested: true,
						escalationReason: input.reason,
					},
					participant: 'bot',
				};

				const url = `${apiBaseUrl!.replace(/\/$/, '')}/api/internal/message`;

				await ctx.helpers.httpRequest({
					method: 'POST',
					url,
					body,
					json: true,
				});

				return 'Escalation request sent successfully. The user has been notified. Do not generate any further text response.';
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				return `Error sending escalation request to ${apiBaseUrl}: ${errorMessage}`;
			}
		},
	});
}

export class ToolCobaltEscalationV3 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Escalation V3',
		name: 'toolCobaltEscalationV3',
		icon: 'fa:headset',
		iconColor: 'black',
		group: ['transform'],
		version: 1,
		description: 'Triggers a live agent escalation in Cobalt',
		defaults: {
			name: 'Cobalt Escalation V3',
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
				description: 'The session ID to escalate',
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
