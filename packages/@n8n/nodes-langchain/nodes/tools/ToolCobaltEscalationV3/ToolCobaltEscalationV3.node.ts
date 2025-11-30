import { Tool } from '@langchain/core/tools';
import {
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	NodeConnectionTypes,
	type SupplyData,
} from 'n8n-workflow';
import { getConnectionHintNoticeField } from '@utils/sharedFields';

class CobaltEscalationTool extends Tool {
	name = 'escalate_to_live_agent';

	description =
		'Call this tool when the user asks to speak to a human, live agent, or support representative. Input should be the reason for escalation.';

	async _call(input: string): Promise<string> {
		let reason = input || 'User requested escalation';
		if (reason.startsWith('{') && reason.endsWith('}')) {
			try {
				const parsed = JSON.parse(reason);
				if (parsed.reason) reason = parsed.reason;
			} catch (e) {
				// ignore
			}
		}

		return JSON.stringify({
			text: 'Escalation requested. A live agent has been notified.',
			meta: {
				liveAgentRequested: true,
				escalationReason: reason,
			},
		});
	}
}

export class ToolCobaltEscalationV3 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Escalation Tool (V3)',
		name: 'toolCobaltEscalationV3',
		icon: 'fa:tools',
		group: ['transform'],
		version: 1,
		description: 'Allows the AI to request a live agent escalation',
		defaults: {
			name: 'Escalate to Agent (V3)',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiTool],
		outputNames: ['Tool'],
		properties: [getConnectionHintNoticeField([NodeConnectionTypes.AiAgent])],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		return {
			response: new CobaltEscalationTool(),
		};
	}
}
