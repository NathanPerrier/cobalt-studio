import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class CcaipApi implements ICredentialType {
	name = 'ccaipApi';
	displayName = 'CCAIP API';
	documentationUrl = 'ccaip';
	properties: INodeProperties[] = [
		{
			displayName: 'Subdomain',
			name: 'subdomain',
			type: 'string',
			default: '',
			placeholder: 'e.g. my-org',
			description: 'The subdomain of your CCAIP instance',
		},
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string',
			default: '',
			placeholder: 'e.g. ccaip.com',
			description: 'The domain of your CCAIP instance',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API Key for Management API',
		},
		{
			displayName: 'Secret',
			name: 'secret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Secret for signing JWT tokens (Client API)',
		},
		{
			displayName: 'Issuer (Company Name)',
			name: 'issuer',
			type: 'string',
			default: '',
			description: 'The issuer claim for the JWT (usually the Company Name or ID)',
		},
	];
}
