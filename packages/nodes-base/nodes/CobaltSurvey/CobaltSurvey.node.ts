import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class CobaltSurvey implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cobalt Survey',
		name: 'cobaltSurvey',
		icon: 'fa:poll',
		group: ['transform'],
		version: 1,
		description: 'Send a survey to the Cobalt chat user',
		defaults: {
			name: 'Cobalt Survey',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				default: '={{$json.sessionId}}',
				required: true,
				description: 'The session ID of the user',
			},
			{
				displayName: 'Survey Title',
				name: 'title',
				type: 'string',
				default: 'Survey',
				required: true,
				description: 'The title of the survey',
			},
			{
				displayName: 'Completion Message',
				name: 'completionMessage',
				type: 'string',
				default: 'Thank you for your feedback!',
				required: true,
				description: 'The message to display when the survey is completed',
			},
			{
				displayName: 'Completion Description',
				name: 'completionDescription',
				type: 'string',
				default: '',
				description: 'Additional text to display below the completion message',
			},
			{
				displayName: 'Questions',
				name: 'questions',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				options: [
					{
						name: 'question',
						displayName: 'Question',
						values: [
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{ name: 'Text', value: 'text' },
									{ name: 'Rating', value: 'rating' },
									{ name: 'Choice', value: 'choice' },
									{ name: 'Boolean', value: 'boolean' },
									{ name: 'NPS', value: 'nps' },
									{ name: 'CES', value: 'ces' },
								],
								default: 'text',
							},
							{
								displayName: 'Title',
								name: 'title',
								type: 'string',
								default: '',
								description: 'The question text',
							},
							{
								displayName: 'Required',
								name: 'required',
								type: 'boolean',
								default: true,
							},
							{
								displayName: 'Options',
								name: 'options',
								type: 'fixedCollection',
								displayOptions: {
									show: {
										type: ['choice'],
									},
								},
								typeOptions: {
									multipleValues: true,
								},
								default: {},
								options: [
									{
										name: 'option',
										displayName: 'Option',
										values: [
											{
												displayName: 'Label',
												name: 'label',
												type: 'string',
												default: '',
											},
											{
												displayName: 'Value',
												name: 'value',
												type: 'string',
												default: '',
											},
										],
									},
								],
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const sessionId = this.getNodeParameter('sessionId', i) as string;
			const title = this.getNodeParameter('title', i) as string;
			const completionMessage = this.getNodeParameter('completionMessage', i) as string;
			const completionDescription = this.getNodeParameter('completionDescription', i) as string;
			const questions = this.getNodeParameter('questions', i) as {
				question: Array<{
					type: string;
					title: string;
					required: boolean;
					options?: { option: Array<{ label: string; value: string }> };
				}>;
			};

			const formattedQuestions = (questions.question || []).map((q, index, arr) => {
				const nextQuestionId = index < arr.length - 1 ? `q-${index + 2}` : 'end';
				const answers = { '*': [{ id: nextQuestionId }] };

				let surveyType = q.type;
				if (q.type === 'choice' || q.type === 'boolean') {
					surveyType = 'options';
				}

				let options: any = q.options?.option?.map((o) => ({ label: o.label, value: o.value }));
				if (q.type === 'boolean') {
					options = [
						{ label: 'Yes', value: 'true' },
						{ label: 'No', value: 'false' },
					];
				} else if (q.type === 'nps') {
					options = { min: 0, max: 10 };
				} else if (q.type === 'ces') {
					options = { min: 1, max: 7 };
				}

				return {
					id: `q-${index + 1}`,
					surveyType,
					title: q.title,
					required: q.required,
					options: options,
					meta: {
						answers,
					},
				};
			});

			formattedQuestions.push({
				id: 'end',
				surveyType: 'end',
				title: completionMessage,
				text: completionDescription,
				required: false,
				options: [],
				meta: { answers: { '*': [] } },
			} as any);

			const body = {
				sessionId,
				type: 'survey',
				plainText: title,
				richContent: [
					{
						type: 'survey',
						title,
						pages: formattedQuestions,
						meta: {
							surveyResponseId: `resp-${sessionId}-${Date.now()}`,
							offerExpirationInterval: 3600, // 1 hour default
							questionExpirationInterval: 3600, // 1 hour default
						},
					},
				],
				meta: {
					offerExpirationInterval: 3600,
					questionExpirationInterval: 3600,
				},
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
