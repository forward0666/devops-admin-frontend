// ============ Extended IAM Data ============

export interface IAMUserFull {
  id: string; username: string; email: string; arn: string
  status: 'active' | 'inactive'; groups: string[]
  mfaEnabled: boolean; mfaType?: 'virtual' | 'hardware' | 'sms'
  passwordEnabled: boolean; passwordAge: number
  accessKeys: { id: string; status: 'Active' | 'Inactive'; created: string; lastUsed: string }[]
  accessKeyAge: number
  lastActivity: string; consoleLastSignIn: string; accessKeyLastUsed: string
  createdAt: string; tags: { key: string; value: string }[]
}

export const iamUsersFull: IAMUserFull[] = [
  { id:'u1',username:'admin',email:'admin@company.com',arn:'arn:iam:123456789:user/admin',status:'active',groups:['Admins'],mfaEnabled:true,mfaType:'virtual',passwordEnabled:true,passwordAge:15,accessKeys:[{id:'AKIAIOSFODNN7EXAMPLE',status:'Active',created:'2024-01-01',lastUsed:'2026-09-07'}],accessKeyAge:980,lastActivity:'2026-09-07',consoleLastSignIn:'2026-09-07',accessKeyLastUsed:'2026-09-07',createdAt:'2023-06-15',tags:[{key:'Department',value:'Engineering'}]},
  { id:'u2',username:'developer1',email:'dev1@company.com',arn:'arn:iam:123456789:user/developer1',status:'active',groups:['Developers'],mfaEnabled:true,mfaType:'virtual',passwordEnabled:true,passwordAge:45,accessKeys:[{id:'AKIAI44QH8DHBEXAMPLE',status:'Active',created:'2024-03-10',lastUsed:'2026-09-06'}],accessKeyAge:540,lastActivity:'2026-09-06',consoleLastSignIn:'2026-09-05',accessKeyLastUsed:'2026-09-06',createdAt:'2023-08-20',tags:[{key:'Team',value:'Backend'}]},
  { id:'u3',username:'developer2',email:'dev2@company.com',arn:'arn:iam:123456789:user/developer2',status:'active',groups:['Developers'],mfaEnabled:false,passwordEnabled:true,passwordAge:120,accessKeys:[{id:'AKIAI44QH8DHCEXAMPLE',status:'Active',created:'2024-05-01',lastUsed:'2026-08-20'}],accessKeyAge:490,lastActivity:'2026-08-20',consoleLastSignIn:'2026-08-15',accessKeyLastUsed:'2026-08-20',createdAt:'2023-11-01',tags:[]},
  { id:'u4',username:'devops-lead',email:'devops@company.com',arn:'arn:iam:123456789:user/devops-lead',status:'active',groups:['DevOps','Admins'],mfaEnabled:true,mfaType:'hardware',passwordEnabled:true,passwordAge:30,accessKeys:[{id:'AKIAI44Q8DHDEXAMPLE',status:'Active',created:'2024-01-10',lastUsed:'2026-09-07'}],accessKeyAge:970,lastActivity:'2026-09-07',consoleLastSignIn:'2026-09-07',accessKeyLastUsed:'2026-09-07',createdAt:'2023-05-10',tags:[{key:'Department',value:'Operations'}]},
  { id:'u5',username:'data-analyst',email:'data@company.com',arn:'arn:iam:123456789:user/data-analyst',status:'active',groups:['DataTeam','ReadOnly'],mfaEnabled:true,mfaType:'virtual',passwordEnabled:true,passwordAge:60,accessKeys:[{id:'AKIAI44QH8DHGEXAMPLE',status:'Active',created:'2024-04-20',lastUsed:'2026-09-06'}],accessKeyAge:500,lastActivity:'2026-09-06',consoleLastSignIn:'2026-09-06',accessKeyLastUsed:'2026-09-06',createdAt:'2024-01-15',tags:[{key:'Department',value:'Analytics'}]},
  { id:'u6',username:'qa-tester',email:'qa@company.com',arn:'arn:iam:123456789:user/qa-tester',status:'active',groups:['QA'],mfaEnabled:false,passwordEnabled:true,passwordAge:200,accessKeys:[{id:'AKIAI44QH8DHHEXAMPLE',status:'Inactive',created:'2024-06-01',lastUsed:'2026-08-15'}],accessKeyAge:460,lastActivity:'2026-08-15',consoleLastSignIn:'2026-08-10',accessKeyLastUsed:'2026-08-15',createdAt:'2024-03-01',tags:[]},
  { id:'u7',username:'security-auditor',email:'security@company.com',arn:'arn:iam:123456789:user/security-auditor',status:'active',groups:['Security'],mfaEnabled:true,mfaType:'hardware',passwordEnabled:true,passwordAge:10,accessKeys:[],accessKeyAge:0,lastActivity:'2026-09-07',consoleLastSignIn:'2026-09-07',accessKeyLastUsed:'Never',createdAt:'2023-07-20',tags:[{key:'Role',value:'Auditor'}]},
  { id:'u8',username:'readonly-user',email:'readonly@company.com',arn:'arn:iam:123456789:user/readonly-user',status:'active',groups:['ReadOnly'],mfaEnabled:false,passwordEnabled:true,passwordAge:90,accessKeys:[],accessKeyAge:0,lastActivity:'2026-09-01',consoleLastSignIn:'2026-09-01',accessKeyLastUsed:'Never',createdAt:'2024-06-01',tags:[]},
  { id:'u9',username:'contractor-ext',email:'contractor@external.com',arn:'arn:iam:123456789:user/contractor-ext',status:'inactive',groups:['ReadOnly'],mfaEnabled:true,mfaType:'virtual',passwordEnabled:true,passwordAge:180,accessKeys:[{id:'AKIAI44QH8DHJEXAMPLE',status:'Inactive',created:'2024-02-01',lastUsed:'2025-12-31'}],accessKeyAge:580,lastActivity:'2025-12-31',consoleLastSignIn:'2025-12-30',accessKeyLastUsed:'2025-12-31',createdAt:'2024-02-01',tags:[{key:'Type',value:'Contractor'}]},
  { id:'u10',username:'ci-deploy-bot',email:'ci@company.com',arn:'arn:iam:123456789:user/ci-deploy-bot',status:'active',groups:['DevOps'],mfaEnabled:false,passwordEnabled:false,passwordAge:0,accessKeys:[{id:'AKIAI44QH8DHKEXAMPLE',status:'Active',created:'2024-01-01',lastUsed:'2026-09-07'}],accessKeyAge:980,lastActivity:'2026-09-07',consoleLastSignIn:'Never',accessKeyLastUsed:'2026-09-07',createdAt:'2024-01-01',tags:[{key:'Type',value:'ServiceAccount'}]},
  { id:'u11',username:'monitoring-bot',email:'monitor@company.com',arn:'arn:iam:123456789:user/monitoring-bot',status:'active',groups:['ReadOnly'],mfaEnabled:false,passwordEnabled:false,passwordAge:0,accessKeys:[{id:'AKIAI44QH8DHLEXAMPLE',status:'Active',created:'2024-04-01',lastUsed:'2026-09-07'}],accessKeyAge:520,lastActivity:'2026-09-07',consoleLastSignIn:'Never',accessKeyLastUsed:'2026-09-07',createdAt:'2024-04-01',tags:[{key:'Type',value:'ServiceAccount'}]},
  { id:'u12',username:'intern-2025',email:'intern@company.com',arn:'arn:iam:123456789:user/intern-2025',status:'inactive',groups:['ReadOnly'],mfaEnabled:false,passwordEnabled:true,passwordAge:365,accessKeys:[],accessKeyAge:0,lastActivity:'2025-08-31',consoleLastSignIn:'2025-08-31',accessKeyLastUsed:'Never',createdAt:'2025-06-01',tags:[{key:'Type',value:'Intern'}]},
  { id:'u13',username:'backup-operator',email:'backup@company.com',arn:'arn:iam:123456789:user/backup-operator',status:'active',groups:['DevOps'],mfaEnabled:true,mfaType:'virtual',passwordEnabled:true,passwordAge:25,accessKeys:[{id:'AKIAI44QH8DHMEXAMPLE',status:'Active',created:'2024-08-01',lastUsed:'2026-09-06'}],accessKeyAge:400,lastActivity:'2026-09-06',consoleLastSignIn:'2026-09-05',accessKeyLastUsed:'2026-09-06',createdAt:'2024-08-01',tags:[{key:'Department',value:'Operations'}]},
  { id:'u14',username:'api-gateway-svc',email:'api@company.com',arn:'arn:iam:123456789:user/api-gateway-svc',status:'active',groups:['Developers'],mfaEnabled:false,passwordEnabled:false,passwordAge:0,accessKeys:[{id:'AKIAI44QH8DHNEXAMPLE',status:'Active',created:'2024-03-15',lastUsed:'2026-09-07'}],accessKeyAge:540,lastActivity:'2026-09-07',consoleLastSignIn:'Never',accessKeyLastUsed:'2026-09-07',createdAt:'2024-03-15',tags:[{key:'Type',value:'ServiceAccount'}]},
  { id:'u15',username:'log-shipper',email:'logs@company.com',arn:'arn:iam:123456789:user/log-shipper',status:'active',groups:['ReadOnly'],mfaEnabled:false,passwordEnabled:false,passwordAge:0,accessKeys:[{id:'AKIAI44QH8DHPEXAMPLE',status:'Active',created:'2024-05-20',lastUsed:'2026-09-07'}],accessKeyAge:470,lastActivity:'2026-09-07',consoleLastSignIn:'Never',accessKeyLastUsed:'2026-09-07',createdAt:'2024-05-20',tags:[{key:'Type',value:'ServiceAccount'}]},
]

export interface IAMGroupFull {
  id: string; name: string; description: string; members: string[]; policies: string[]; createdAt: string
}
export const iamGroupsFull: IAMGroupFull[] = [
  {id:'g1',name:'Admins',description:'Full administrative access',members:['u1','u4'],policies:['p1'],createdAt:'2023-05-10'},
  {id:'g2',name:'Developers',description:'Development team',members:['u2','u3','u14'],policies:['p3','p5','p10'],createdAt:'2023-06-15'},
  {id:'g3',name:'DevOps',description:'Infrastructure management',members:['u4','u10','u13'],policies:['p3','p5','p7','p10'],createdAt:'2023-06-15'},
  {id:'g4',name:'DataTeam',description:'Analytics team',members:['u5'],policies:['p5','p11','p16'],createdAt:'2024-01-15'},
  {id:'g5',name:'ReadOnly',description:'Read-only access',members:['u5','u8','u9','u11','u12','u15'],policies:['p2'],createdAt:'2023-07-01'},
  {id:'g6',name:'QA',description:'Quality assurance',members:['u6'],policies:['p2','p3'],createdAt:'2024-03-01'},
  {id:'g7',name:'Security',description:'Security audit',members:['u7'],policies:['p14'],createdAt:'2023-07-20'},
  {id:'g8',name:'Billing',description:'Cost management',members:[],policies:['p18'],createdAt:'2024-06-01'},
]

export interface IAMRoleFull {
  id: string; name: string; description: string; arn: string
  trustPolicy: any; trustType: string
  policies: string[]; maxSessionDuration: number
  createdAt: string; lastActivity: string; tags: { key: string; value: string }[]
}
export const iamRolesFull: IAMRoleFull[] = [
  {id:'r1',name:'EC2-Service-Role',description:'EC2 instance role',arn:'arn:iam:123456789:role/EC2-Service-Role',trustPolicy:{Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{Service:'ec2.example.com'},Action:'sts:AssumeRole'}]},trustType:'Cloud Service',policies:['p3','p5'],maxSessionDuration:3600,createdAt:'2023-06-01',lastActivity:'2026-09-07',tags:[{key:'Service',value:'EC2'}]},
  {id:'r2',name:'Lambda-Execution-Role',description:'Lambda execution',arn:'arn:iam:123456789:role/Lambda-Execution-Role',trustPolicy:{Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{Service:'lambda.example.com'},Action:'sts:AssumeRole'}]},trustType:'Cloud Service',policies:['p10','p5','p16'],maxSessionDuration:3600,createdAt:'2023-07-15',lastActivity:'2026-09-07',tags:[{key:'Service',value:'Lambda'}]},
  {id:'r3',name:'CrossAccount-Admin',description:'Cross-account access',arn:'arn:iam:123456789:role/CrossAccount-Admin',trustPolicy:{Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{Another:'987654321'},Action:'sts:AssumeRole'}]},trustType:'Another account',policies:['p1'],maxSessionDuration:43200,createdAt:'2023-08-01',lastActivity:'2026-09-06',tags:[]},
  {id:'r4',name:'CI-CD-Pipeline-Role',description:'CI/CD pipeline',arn:'arn:iam:123456789:role/CI-CD-Pipeline-Role',trustPolicy:{Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{Service:'codepipeline.example.com'},Action:'sts:AssumeRole'}]},trustType:'Cloud Service',policies:['p3','p5','p7','p10'],maxSessionDuration:3600,createdAt:'2024-01-01',lastActivity:'2026-09-07',tags:[]},
  {id:'r5',name:'ReadOnly-Audit-Role',description:'Audit access',arn:'arn:iam:123456789:role/ReadOnly-Audit-Role',trustPolicy:{Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{Another:'987654321'},Action:'sts:AssumeRole'}]},trustType:'Another account',policies:['p2','p14'],maxSessionDuration:3600,createdAt:'2023-09-01',lastActivity:'2026-09-05',tags:[]},
  {id:'r6',name:'SAML-Federation-Role',description:'SAML SSO',arn:'arn:iam:123456789:role/SAML-Federation-Role',trustPolicy:{Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{Federated:'arn:iam:123456789:saml-provider/Okta-SAML'},Action:'sts:AssumeRoleWithSAML'}]},trustType:'SAML',policies:['p1'],maxSessionDuration:28800,createdAt:'2024-02-01',lastActivity:'2026-09-07',tags:[]},
  {id:'r7',name:'WebIdentity-Cognito',description:'Cognito federation',arn:'arn:iam:123456789:role/WebIdentity-Cognito',trustPolicy:{Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{Federated:'cognito-identity.example.com'},Action:'sts:AssumeRoleWithWebIdentity'}]},trustType:'Web Identity',policies:['p5'],maxSessionDuration:3600,createdAt:'2024-03-15',lastActivity:'2026-09-04',tags:[]},
  {id:'r8',name:'ECS-Task-Execution',description:'ECS task execution',arn:'arn:iam:123456789:role/ECS-Task-Execution',trustPolicy:{Version:'2012-10-17',Statement:[{Effect:'Allow',Principal:{Service:'ecs-tasks.example.com'},Action:'sts:AssumeRole'}]},trustType:'Cloud Service',policies:['p5','p15'],maxSessionDuration:3600,createdAt:'2024-04-01',lastActivity:'2026-09-07',tags:[]},
]

export interface IAMPolicyFull {
  id: string; name: string; description: string; arn: string
  type: 'Managed' | 'Custom'
  usedAs: string; attachmentCount: number
  policyDocument: any; createdAt: string; lastActivity: string
}
export const iamPoliciesFull: IAMPolicyFull[] = [
  {id:'p1',name:'AdministratorAccess',description:'Full access to all resources',arn:'arn:iam:policy/AdministratorAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:3,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['*'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-07'},
  {id:'p2',name:'ReadOnlyAccess',description:'View all resources',arn:'arn:iam:policy/ReadOnlyAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:6,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['iam:List', 'iam:Get', 'iam:Describe'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-07'},
  {id:'p3',name:'EC2FullAccess',description:'Full EC2 management',arn:'arn:iam:policy/EC2FullAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:4,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['ec2:List', 'ec2:Get', 'ec2:Describe', 'ec2:Create', 'ec2:Update', 'ec2:Delete', 'ec2:Tagging'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-07'},
  {id:'p4',name:'EC2ReadOnlyAccess',description:'View EC2 resources',arn:'arn:iam:policy/EC2ReadOnlyAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:1,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['ec2:List', 'ec2:Get', 'ec2:Describe'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-05'},
  {id:'p5',name:'S3FullAccess',description:'Full S3 management',arn:'arn:iam:policy/S3FullAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:5,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['s3:List', 's3:Get', 's3:Describe', 's3:Create', 's3:Update', 's3:Delete', 's3:Tagging'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-07'},
  {id:'p6',name:'S3ReadOnlyAccess',description:'View S3 resources',arn:'arn:iam:policy/S3ReadOnlyAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:1,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['s3:List', 's3:Get', 's3:Describe'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-01'},
  {id:'p7',name:'IAMFullAccess',description:'Full IAM management',arn:'arn:iam:policy/IAMFullAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:2,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['iam:List', 'iam:Get', 'iam:Describe', 'iam:Create', 'iam:Update', 'iam:Delete', 'iam:Permissions', 'iam:Tagging', 'iam:Pass'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-07'},
  {id:'p8',name:'IAMReadOnlyAccess',description:'View IAM resources',arn:'arn:iam:policy/IAMReadOnlyAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:1,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['iam:List', 'iam:Get', 'iam:Describe'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-01'},
  {id:'p9',name:'LambdaFullAccess',description:'Full Lambda management',arn:'arn:iam:policy/LambdaFullAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:1,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['lambda:List', 'lambda:Get', 'lambda:Describe', 'lambda:Create', 'lambda:Update', 'lambda:Delete', 'lambda:Tagging'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-07'},
  {id:'p10',name:'DynamoDBFullAccess',description:'Full DynamoDB management',arn:'arn:iam:policy/DynamoDBFullAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:3,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['dynamodb:List', 'dynamodb:Get', 'dynamodb:Describe', 'dynamodb:Create', 'dynamodb:Update', 'dynamodb:Delete', 'dynamodb:Tagging'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-07'},
  {id:'p11',name:'RDSFullAccess',description:'Full RDS management',arn:'arn:iam:policy/RDSFullAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:1,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['rds:List', 'rds:Get', 'rds:Describe', 'rds:Create', 'rds:Update', 'rds:Delete', 'rds:Tagging'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-06'},
  {id:'p12',name:'CloudWatchReadOnly',description:'View CloudWatch metrics',arn:'arn:iam:policy/CloudWatchReadOnly',type:'Managed',usedAs:'Permissions policy',attachmentCount:2,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['cloudwatch:List', 'cloudwatch:Get', 'cloudwatch:Describe'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-07'},
  {id:'p13',name:'CloudFormationFullAccess',description:'Full CloudFormation',arn:'arn:iam:policy/CloudFormationFullAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:1,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['cloudformation:List', 'cloudformation:Get', 'cloudformation:Describe', 'cloudformation:Create', 'cloudformation:Update', 'cloudformation:Delete', 'cloudformation:Tagging'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-05'},
  {id:'p14',name:'SecurityAudit',description:'Security auditing',arn:'arn:iam:policy/SecurityAudit',type:'Managed',usedAs:'Permissions policy',attachmentCount:2,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['iam:List', 'iam:Get', 'iam:Describe', 'cloudtrail:List', 'cloudtrail:Get', 'cloudtrail:Describe'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-07'},
  {id:'p15',name:'ECSFullAccess',description:'Full ECS management',arn:'arn:iam:policy/ECSFullAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:1,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['ecs:List', 'ecs:Get', 'ecs:Describe', 'ecs:Create', 'ecs:Update', 'ecs:Delete', 'ecs:Tagging'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-07'},
  {id:'p16',name:'CloudTrailReadOnly',description:'View CloudTrail logs',arn:'arn:iam:policy/CloudTrailReadOnly',type:'Managed',usedAs:'Permissions policy',attachmentCount:2,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['cloudtrail:List', 'cloudtrail:Get', 'cloudtrail:Describe'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-06'},
  {id:'p17',name:'VPCFullAccess',description:'Full VPC management',arn:'arn:iam:policy/VPCFullAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:1,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['vpc:List', 'vpc:Get', 'vpc:Describe', 'vpc:Create', 'vpc:Update', 'vpc:Delete', 'vpc:Tagging'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-05'},
  {id:'p18',name:'BillingFullAccess',description:'Billing access',arn:'arn:iam:policy/BillingFullAccess',type:'Managed',usedAs:'Permissions policy',attachmentCount:1,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['billing:List', 'billing:Get', 'billing:Describe', 'billing:Create', 'billing:Update', 'billing:Delete', 'billing:Tagging'],Resource:'*'}]},createdAt:'2023-01-01',lastActivity:'2026-09-01'},
  {id:'p19',name:'Custom-DeployPolicy',description:'CI/CD deployment',arn:'arn:iam:123456789:policy/Custom-DeployPolicy',type:'Custom',usedAs:'Permissions policy',attachmentCount:2,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:['s3:Create', 's3:Update', 'lambda:Create', 'lambda:Update', 'ecs:Create', 'ecs:Update'],Resource:'*'}]},createdAt:'2024-01-15',lastActivity:'2026-09-07'},
  {id:'p20',name:'Custom-DenyDelete',description:'Deny delete operations',arn:'arn:iam:123456789:policy/Custom-DenyDelete',type:'Custom',usedAs:'Permissions policy',attachmentCount:1,policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Deny',Action:['s3:Delete', 'ec2:Delete', 'rds:Delete'],Resource:'*'}]},createdAt:'2024-02-01',lastActivity:'2026-09-07'},
]

export interface IdentityProvider {
  id: string; name: string; type: 'SAML' | 'OpenID Connect'
  arn: string; metadataUrl?: string; clientId?: string
  createdAt: string
}
export const identityProviders: IdentityProvider[] = [
  {id:'idp-1',name:'Okta-SAML',type:'SAML',arn:'arn:iam:123456789:saml-provider/Okta-SAML',metadataUrl:'https://company.okta.com/app/abc/sso/saml/metadata',createdAt:'2023-06-01'},
  {id:'idp-2',name:'Google-Workspace',type:'SAML',arn:'arn:iam:123456789:saml-provider/Google-Workspace',metadataUrl:'https://accounts.google.com/saml2/metadata',createdAt:'2023-09-15'},
  {id:'idp-3',name:'GitHub-Actions',type:'OpenID Connect',arn:'arn:iam:123456789:oidc-provider/token.actions.githubusercontent.com',clientId:'sts.example.com',createdAt:'2024-01-10'},
  {id:'idp-4',name:'GitLab-CI',type:'OpenID Connect',arn:'arn:iam:123456789:oidc-provider/gitlab.company.com',clientId:'https://gitlab.company.com',createdAt:'2024-03-20'},
]

export interface AccessAnalyzerFinding {
  id: string; resource: string; resourceType: string; principal: string
  action: string; isPublic: boolean; status: 'Active' | 'Resolved'
  createdAt: string
}
export const accessAnalyzerFindings: AccessAnalyzerFinding[] = [
  {id:'f1',resource:'arn:s3:::public-docs-bucket',resourceType:'S3::Bucket',principal:'*',action:'s3:GetObject',isPublic:true,status:'Active',createdAt:'2026-09-01'},
  {id:'f2',resource:'arn:s3:::internal-logs',resourceType:'S3::Bucket',principal:'987654321',action:'s3:*',isPublic:false,status:'Active',createdAt:'2026-09-03'},
  {id:'f3',resource:'arn:iam:123456789:role/CrossAccount-Admin',resourceType:'IAM::Role',principal:'987654321',action:'sts:AssumeRole',isPublic:false,status:'Active',createdAt:'2026-08-20'},
  {id:'f4',resource:'arn:lambda:us-east-1:123456789:function:public-api',resourceType:'Lambda::Function',principal:'*',action:'lambda:InvokeFunction',isPublic:true,status:'Active',createdAt:'2026-09-05'},
  {id:'f5',resource:'arn:s3:::old-backup-bucket',resourceType:'S3::Bucket',principal:'*',action:'s3:GetObject',isPublic:true,status:'Resolved',createdAt:'2026-07-15'},
  {id:'f6',resource:'arn:iam:123456789:role/ReadOnly-Audit-Role',resourceType:'IAM::Role',principal:'987654321',action:'sts:AssumeRole',isPublic:false,status:'Active',createdAt:'2026-08-25'},
]

export interface UnusedAccess {
  id: string; entityType: 'User' | 'Role'; entityName: string
  unusedPermissions: string[]; lastActivity: string; recommendation: string
}
export const unusedAccess: UnusedAccess[] = [
  {id:'ua1',entityType:'User',entityName:'contractor-ext',unusedPermissions:['s3:*','ec2:*','lambda:*'],lastActivity:'2025-12-31',recommendation:'Remove from ReadOnly group, deactivate access keys'},
  {id:'ua2',entityType:'User',entityName:'intern-2025',unusedPermissions:['s3:Get*','ec2:Describe*'],lastActivity:'2025-08-31',recommendation:'Delete user - inactive for over 1 year'},
  {id:'ua3',entityType:'User',entityName:'qa-tester',unusedPermissions:['ec2:*','rds:*','lambda:*'],lastActivity:'2026-08-15',recommendation:'Remove unused policies, keep only QA-related access'},
  {id:'ua4',entityType:'Role',entityName:'WebIdentity-Cognito',unusedPermissions:['s3:*','dynamodb:*'],lastActivity:'2026-09-04',recommendation:'Review if all attached policies are needed'},
  {id:'ua5',entityType:'User',entityName:'readonly-user',unusedPermissions:['iam:List*','cloudtrail:Get*'],lastActivity:'2026-09-01',recommendation:'Consider if user still needs ReadOnly group membership'},
]

export const credentialReport = iamUsersFull.map(u => ({
  user: u.username, arn: u.arn,
  passwordEnabled: u.passwordEnabled, mfaActive: u.mfaEnabled,
  accessKey1Active: u.accessKeys[0]?.status === 'Active' || false,
  accessKey1LastUsed: u.accessKeys[0]?.lastUsed || 'N/A',
  accessKey2Active: u.accessKeys[1]?.status === 'Active' || false,
  accessKey2LastUsed: u.accessKeys[1]?.lastUsed || 'N/A',
  lastActivity: u.lastActivity, lastConsoleLogin: u.consoleLastSignIn,
}))

export const passwordPolicy = {
  minimumPasswordLength: 14, requireSymbols: true, requireNumbers: true,
  requireUppercase: true, requireLowercase: true,
  allowUsersToChangePassword: true, maxPasswordAge: 90,
  passwordReusePrevention: 24, hardExpiry: false,
}

export const iamDashboardStats = {
  users: { total: 15, active: 12, inactive: 3, mfaEnabled: 8 },
  groups: { total: 8 }, roles: { total: 8 },
  policies: { total: 20, managed: 18, custom: 2 },
  securityChecklist: [
    { id: 'root-mfa', title: 'Enable MFA for root account', done: true },
    { id: 'no-root', title: 'Do not use root for daily tasks', done: true },
    { id: 'user-mfa', title: 'Enable MFA for IAM users', done: false },
    { id: 'rotate-keys', title: 'Rotate access keys regularly', done: false },
    { id: 'strong-pw', title: 'Use strong password policy', done: true },
    { id: 'use-roles', title: 'Use roles for delegation', done: true },
  ],
  recentActivity: [
    { action: 'User login', user: 'admin', time: '2026-09-07 10:30' },
    { action: 'Policy attached', user: 'devops-lead', time: '2026-09-07 09:15' },
    { action: 'Access key rotated', user: 'developer1', time: '2026-09-06 16:45' },
    { action: 'Role assumed', user: 'ci-deploy-bot', time: '2026-09-06 14:20' },
    { action: 'User created', user: 'admin', time: '2026-09-05 11:00' },
  ],
}

export interface SCPolicy {
  id: string; name: string; description: string; type: 'Service control' | 'Resource control'
  targets: string[]; policyDocument: any; status: 'Attached' | 'Detached'
}
export const scPolicies: SCPolicy[] = [
  {id:'scp-1',name:'FullAccess',description:'Allows all actions (default)',type:'Service control',targets:['Root OU'],policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Allow',Action:'*',Resource:'*'}]},status:'Attached'},
  {id:'scp-2',name:'DenyDisableCloudTrail',description:'Prevent disabling CloudTrail',type:'Service control',targets:['Root OU'],policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Deny',Action:['cloudtrail:StopLogging','cloudtrail:DeleteTrail'],Resource:'*'}]},status:'Attached'},
  {id:'scp-3',name:'RequireSSMEncryption',description:'Require SSM encryption',type:'Service control',targets:['Production OU'],policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Deny',Action:['ssm:SendCommand','ssm:GetCommandInvocation'],Resource:'*',Condition:{Bool:{'ssm:encrypted':'false'}}}]},status:'Attached'},
  {id:'scp-4',name:'RestrictRegions',description:'Limit to specific regions',type:'Service control',targets:['Production OU'],policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Deny',Action:'*',Resource:'*',Condition:{StringNotEquals:{'requestedRegion':['us-east-1','us-west-2','eu-west-1']}}}]},status:'Attached'},
  {id:'scp-5',name:'S3BucketLock',description:'Prevent S3 bucket deletion',type:'Resource control',targets:['Production OU'],policyDocument:{Version:'2012-10-17',Statement:[{Effect:'Deny',Action:['s3:DeleteBucket','s3:PutBucketPolicy'],Resource:'arn:s3:::critical-*'}]},status:'Attached'},
]

// ============ Service Catalog ============

export interface ServiceCatalogItem {
  id: string
  name: string
  displayName: string
  description: string
  serviceUrl: string
  category: 'Compute' | 'Storage' | 'Database' | 'Security' | 'Networking' | 'Management' | 'Developer Tools' | 'Analytics' | 'AI/ML' | 'Application Integration' | 'Containers' | 'Cost Management'
  status: 'published' | 'in-development' | 'experimental' | 'deprecated'
  version: string
  owner: string
  createdAt: string
  lastUpdated: string
  tags: string[]
  endpoints: { name: string; url: string; method: string }[]
  healthCheck: { enabled: boolean; url: string; interval: number }
  metadata: Record<string, string>
}

export const serviceCatalog: ServiceCatalogItem[] = [
  {
    id: 'svc-001', name: 'ec2', displayName: 'EC2', description: 'Virtual servers in the cloud. Scalable compute capacity for running applications.',
    serviceUrl: 'ec2.example.com', category: 'Compute', status: 'published', version: '2.4.1', owner: 'Compute Team',
    createdAt: '2023-01-15', lastUpdated: '2026-08-20', tags: ['compute', 'virtual-machines', 'scaling'],
    endpoints: [
      { name: 'List Instances', url: '/api/ec2/instances', method: 'GET' },
      { name: 'Launch Instance', url: '/api/ec2/instances', method: 'POST' },
      { name: 'Terminate Instance', url: '/api/ec2/instances/:id', method: 'DELETE' },
    ],
    healthCheck: { enabled: true, url: 'https://ec2.example.com/health', interval: 30 },
    metadata: { region: 'us-east-1', maxInstances: '500', instanceTypes: 't3,m5,c5,r5' },
  },
  {
    id: 'svc-002', name: 'lambda', displayName: 'Lambda', description: 'Run code without provisioning or managing servers. Pay only for compute time consumed.',
    serviceUrl: 'lambda.example.com', category: 'Compute', status: 'published', version: '1.8.0', owner: 'Serverless Team',
    createdAt: '2023-03-10', lastUpdated: '2026-09-01', tags: ['serverless', 'functions', 'event-driven'],
    endpoints: [
      { name: 'List Functions', url: '/api/lambda/functions', method: 'GET' },
      { name: 'Invoke Function', url: '/api/lambda/functions/:name/invoke', method: 'POST' },
    ],
    healthCheck: { enabled: true, url: 'https://lambda.example.com/health', interval: 60 },
    metadata: { runtime: 'nodejs20.x,python3.12', timeout: '900s', memory: '128MB-10GB' },
  },
  {
    id: 'svc-003', name: 'ecs', displayName: 'ECS', description: 'Fully managed container orchestration service for running Docker containers.',
    serviceUrl: 'ecs.example.com', category: 'Containers', status: 'experimental', version: '0.9.0', owner: 'Container Team',
    createdAt: '2024-06-01', lastUpdated: '2026-08-15', tags: ['containers', 'docker', 'orchestration'],
    endpoints: [
      { name: 'List Clusters', url: '/api/ecs/clusters', method: 'GET' },
      { name: 'List Services', url: '/api/ecs/services', method: 'GET' },
    ],
    healthCheck: { enabled: false, url: '', interval: 0 },
    metadata: { launchType: 'FARGATE,EC2', networkMode: 'awsvpc' },
  },
  {
    id: 'svc-004', name: 's3', displayName: 'S3', description: 'Object storage service offering industry-leading scalability, data availability, security, and performance.',
    serviceUrl: 's3.example.com', category: 'Storage', status: 'published', version: '3.2.0', owner: 'Storage Team',
    createdAt: '2023-01-15', lastUpdated: '2026-09-05', tags: ['storage', 'object-storage', 'backup'],
    endpoints: [
      { name: 'List Buckets', url: '/api/s3/buckets', method: 'GET' },
      { name: 'Create Bucket', url: '/api/s3/buckets', method: 'POST' },
      { name: 'Upload Object', url: '/api/s3/buckets/:bucket/objects', method: 'PUT' },
    ],
    healthCheck: { enabled: true, url: 'https://s3.example.com/health', interval: 30 },
    metadata: { durability: '99.999999999%', storageClasses: 'STANDARD,IA,GLACIER' },
  },
  {
    id: 'svc-005', name: 'ebs', displayName: 'EBS', description: 'Easy to use, high-performance block storage at any scale for EC2 instances.',
    serviceUrl: 'ebs.example.com', category: 'Storage', status: 'published', version: '2.1.0', owner: 'Storage Team',
    createdAt: '2023-02-20', lastUpdated: '2026-07-10', tags: ['storage', 'block-storage', 'volumes'],
    endpoints: [
      { name: 'List Volumes', url: '/api/ebs/volumes', method: 'GET' },
      { name: 'Create Volume', url: '/api/ebs/volumes', method: 'POST' },
    ],
    healthCheck: { enabled: true, url: 'https://ebs.example.com/health', interval: 60 },
    metadata: { volumeTypes: 'gp3,io2,st1,sc1', maxVolumeSize: '64 TiB' },
  },
  {
    id: 'svc-006', name: 'efs', displayName: 'EFS', description: 'Simple, serverless, elastic file system for use with cloud services and on-premises resources.',
    serviceUrl: 'efs.example.com', category: 'Storage', status: 'in-development', version: '0.5.0', owner: 'Storage Team',
    createdAt: '2025-01-10', lastUpdated: '2026-08-28', tags: ['storage', 'file-system', 'nfs'],
    endpoints: [
      { name: 'List File Systems', url: '/api/efs/filesystems', method: 'GET' },
    ],
    healthCheck: { enabled: false, url: '', interval: 0 },
    metadata: { performanceMode: 'generalPurpose,maxIO', throughputMode: 'bursting,provisioned' },
  },
  {
    id: 'svc-007', name: 'rds', displayName: 'RDS', description: 'Managed relational database service for MySQL, PostgreSQL, MariaDB, Oracle, SQL Server.',
    serviceUrl: 'rds.example.com', category: 'Database', status: 'published', version: '3.0.2', owner: 'Database Team',
    createdAt: '2023-01-15', lastUpdated: '2026-08-30', tags: ['database', 'sql', 'managed'],
    endpoints: [
      { name: 'List Instances', url: '/api/rds/instances', method: 'GET' },
      { name: 'Create Instance', url: '/api/rds/instances', method: 'POST' },
      { name: 'Create Snapshot', url: '/api/rds/snapshots', method: 'POST' },
    ],
    healthCheck: { enabled: true, url: 'https://rds.example.com/health', interval: 30 },
    metadata: { engines: 'mysql,postgres,mariadb,oracle,sqlserver', maxStorage: '64 TiB' },
  },
  {
    id: 'svc-008', name: 'dynamodb', displayName: 'DynamoDB', description: 'Fast, flexible NoSQL database service for single-digit millisecond performance at any scale.',
    serviceUrl: 'dynamodb.example.com', category: 'Database', status: 'published', version: '2.5.0', owner: 'Database Team',
    createdAt: '2023-04-01', lastUpdated: '2026-09-02', tags: ['database', 'nosql', 'serverless'],
    endpoints: [
      { name: 'List Tables', url: '/api/dynamodb/tables', method: 'GET' },
      { name: 'Query', url: '/api/dynamodb/tables/:name/query', method: 'POST' },
    ],
    healthCheck: { enabled: true, url: 'https://dynamodb.example.com/health', interval: 60 },
    metadata: { consistency: 'eventual,strong', capacityMode: 'on-demand,provisioned' },
  },
  {
    id: 'svc-009', name: 'elasticache', displayName: 'ElastiCache', description: 'Fully managed Redis and Memcached compatible in-memory data store.',
    serviceUrl: 'elasticache.example.com', category: 'Database', status: 'experimental', version: '0.8.0', owner: 'Database Team',
    createdAt: '2024-09-01', lastUpdated: '2026-08-20', tags: ['database', 'cache', 'redis', 'in-memory'],
    endpoints: [
      { name: 'List Clusters', url: '/api/elasticache/clusters', method: 'GET' },
    ],
    healthCheck: { enabled: false, url: '', interval: 0 },
    metadata: { engines: 'redis,memcached', nodeTypes: 'cache.t3,cache.r6g' },
  },
  {
    id: 'svc-010', name: 'iam', displayName: 'IAM', description: 'Manage access to resources. Control who is authenticated and authorized to use resources.',
    serviceUrl: 'iam.example.com', category: 'Security', status: 'published', version: '4.1.0', owner: 'Security Team',
    createdAt: '2023-01-01', lastUpdated: '2026-09-07', tags: ['security', 'identity', 'access-management'],
    endpoints: [
      { name: 'List Users', url: '/api/iam/users', method: 'GET' },
      { name: 'List Roles', url: '/api/iam/roles', method: 'GET' },
      { name: 'List Policies', url: '/api/iam/policies', method: 'GET' },
    ],
    healthCheck: { enabled: true, url: 'https://iam.example.com/health', interval: 30 },
    metadata: { mfaTypes: 'virtual,hardware,passkey', maxUsers: '5000' },
  },
  {
    id: 'svc-011', name: 'kms', displayName: 'KMS', description: 'Create and manage cryptographic keys for data encryption across services.',
    serviceUrl: 'kms.example.com', category: 'Security', status: 'published', version: '1.9.0', owner: 'Security Team',
    createdAt: '2023-05-15', lastUpdated: '2026-08-10', tags: ['security', 'encryption', 'keys'],
    endpoints: [
      { name: 'List Keys', url: '/api/kms/keys', method: 'GET' },
      { name: 'Encrypt', url: '/api/kms/keys/:id/encrypt', method: 'POST' },
    ],
    healthCheck: { enabled: true, url: 'https://kms.example.com/health', interval: 60 },
    metadata: { keyTypes: 'RSA,EC,Symmetric', maxKeys: '10000' },
  },
  {
    id: 'svc-012', name: 'waf', displayName: 'WAF', description: 'Web application firewall that protects against common web exploits and bots.',
    serviceUrl: 'waf.example.com', category: 'Security', status: 'in-development', version: '0.7.0', owner: 'Security Team',
    createdAt: '2025-03-01', lastUpdated: '2026-09-01', tags: ['security', 'firewall', 'web'],
    endpoints: [
      { name: 'List Rules', url: '/api/waf/rules', method: 'GET' },
    ],
    healthCheck: { enabled: false, url: '', interval: 0 },
    metadata: { ruleGroups: 'OWASP,IP reputation,rate-limiting' },
  },
  {
    id: 'svc-013', name: 'vpc', displayName: 'VPC', description: 'Isolated virtual network for launching resources in a defined virtual network.',
    serviceUrl: 'vpc.example.com', category: 'Networking', status: 'published', version: '2.3.0', owner: 'Network Team',
    createdAt: '2023-01-15', lastUpdated: '2026-07-25', tags: ['networking', 'virtual-network', 'isolation'],
    endpoints: [
      { name: 'List VPCs', url: '/api/vpc/vpcs', method: 'GET' },
      { name: 'List Subnets', url: '/api/vpc/subnets', method: 'GET' },
    ],
    healthCheck: { enabled: true, url: 'https://vpc.example.com/health', interval: 60 },
    metadata: { cidrRange: '10.0.0.0/16', maxSubnets: '200' },
  },
  {
    id: 'svc-014', name: 'cloudfront', displayName: 'CloudFront', description: 'Global content delivery network for fast distribution of static and dynamic web content.',
    serviceUrl: 'cloudfront.example.com', category: 'Networking', status: 'published', version: '1.7.0', owner: 'Network Team',
    createdAt: '2023-06-01', lastUpdated: '2026-08-15', tags: ['networking', 'cdn', 'delivery'],
    endpoints: [
      { name: 'List Distributions', url: '/api/cloudfront/distributions', method: 'GET' },
    ],
    healthCheck: { enabled: true, url: 'https://cloudfront.example.com/health', interval: 120 },
    metadata: { edgeLocations: '400+', protocols: 'HTTP/2,HTTP/3' },
  },
  {
    id: 'svc-015', name: 'route53', displayName: 'Route 53', description: 'Highly available and scalable Domain Name System web name service.',
    serviceUrl: 'route53.example.com', category: 'Networking', status: 'published', version: '1.4.0', owner: 'Network Team',
    createdAt: '2023-07-15', lastUpdated: '2026-08-01', tags: ['networking', 'dns', 'domains'],
    endpoints: [
      { name: 'List Hosted Zones', url: '/api/route53/zones', method: 'GET' },
      { name: 'List Records', url: '/api/route53/zones/:id/records', method: 'GET' },
    ],
    healthCheck: { enabled: true, url: 'https://route53.example.com/health', interval: 60 },
    metadata: { recordTypes: 'A,AAAA,CNAME,MX,TXT,SRV', routingPolicies: 'simple,weighted,latency,failover' },
  },
  {
    id: 'svc-016', name: 'cloudwatch', displayName: 'CloudWatch', description: 'Observability and monitoring service for resources and applications.',
    serviceUrl: 'cloudwatch.example.com', category: 'Management', status: 'published', version: '2.0.0', owner: 'Observability Team',
    createdAt: '2023-02-01', lastUpdated: '2026-09-03', tags: ['monitoring', 'logging', 'alerts'],
    endpoints: [
      { name: 'List Metrics', url: '/api/cloudwatch/metrics', method: 'GET' },
      { name: 'List Alarms', url: '/api/cloudwatch/alarms', method: 'GET' },
    ],
    healthCheck: { enabled: true, url: 'https://cloudwatch.example.com/health', interval: 30 },
    metadata: { retentionDays: '90', alarmTypes: 'metric,composite' },
  },
  {
    id: 'svc-017', name: 'cloudformation', displayName: 'CloudFormation', description: 'Model and provision cloud infrastructure resources using templates.',
    serviceUrl: 'cloudformation.example.com', category: 'Management', status: 'experimental', version: '0.6.0', owner: 'Platform Team',
    createdAt: '2024-11-01', lastUpdated: '2026-08-25', tags: ['infrastructure', 'templates', 'iac'],
    endpoints: [
      { name: 'List Stacks', url: '/api/cloudformation/stacks', method: 'GET' },
      { name: 'Create Stack', url: '/api/cloudformation/stacks', method: 'POST' },
    ],
    healthCheck: { enabled: false, url: '', interval: 0 },
    metadata: { templateFormats: 'JSON,YAML', maxResources: '500' },
  },
  {
    id: 'svc-018', name: 'codepipeline', displayName: 'CodePipeline', description: 'Continuous delivery service for fast and reliable application updates.',
    serviceUrl: 'codepipeline.example.com', category: 'Developer Tools', status: 'in-development', version: '0.4.0', owner: 'DevOps Team',
    createdAt: '2025-06-01', lastUpdated: '2026-09-01', tags: ['ci-cd', 'pipeline', 'deployment'],
    endpoints: [
      { name: 'List Pipelines', url: '/api/codepipeline/pipelines', method: 'GET' },
      { name: 'Start Pipeline', url: '/api/codepipeline/pipelines/:name/start', method: 'POST' },
    ],
    healthCheck: { enabled: false, url: '', interval: 0 },
    metadata: { stages: 'source,build,test,deploy', providers: 'GitHub,BuildKite,Jenkins' },
  },
]
