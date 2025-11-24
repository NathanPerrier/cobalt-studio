import { DynamicTool } from '@langchain/core/tools';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	NodeConnectionTypes,
	type SupplyData,
} from 'n8n-workflow';

export class ToolCobaltEscalation implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Escalation Tool',
		name: 'toolCobaltEscalation',
		icon: 'fa:user-headset',
		group: ['transform'],
		version: 1,
		description: 'Allows the AI to request a live agent escalation',
		defaults: {
			name: 'Escalate to Agent',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiTool],
		properties: [
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
		let sessionId: string | undefined;
		try {
			sessionId = this.getNodeParameter('sessionId', itemIndex) as string;
		} catch (error) {
			// Ignore if parameter is missing
		}

		let apiBaseUrl: string | undefined;
		try {
			apiBaseUrl = this.getNodeParameter('apiBaseUrl', itemIndex) as string;
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

		const tool = new DynamicTool({
			name: 'escalate_to_live_agent',
			description:
				'Call this tool when the user asks to speak to a human, live agent, or support representative. It will flag the conversation for escalation. Input should be a JSON string with a "reason" property.',
			func: async (input: string) => {
				if (!sessionId) {
					return 'Error: Could not determine Session ID for escalation. Please ensure the Session ID parameter is set in the tool node.';
				}

				let reason = 'User requested escalation';
				try {
					const parsed = JSON.parse(input) as { reason?: string };
					if (parsed.reason) reason = parsed.reason;
				} catch (e) {
					// Input might be just the reason string if the model didn't output JSON
					if (input?.trim()) reason = input;
				}

				try {
					const body = {
						sessionId,
						payload: {
							liveAgentRequested: true,
							escalationReason: reason,
						},
					};

					const url = `${apiBaseUrl.replace(/\/$/, '')}/api/state/datastore`;

					// Use axios directly if helpers fail or for debugging
					// But first try to log the URL to see what's happening
					if (!url?.startsWith('http')) {
						return `Error: Invalid URL constructed: ${url}`;
					}

					await this.helpers.httpRequest({
						method: 'POST',
						url,
						body,
						json: true,
					});

					return 'Escalation requested successfully. A live agent has been notified.';
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					return `Error requesting escalation to ${apiBaseUrl}: ${errorMessage}`;
				}
			},
		});

		return await Promise.resolve({
			response: tool,
		});
	}
}
