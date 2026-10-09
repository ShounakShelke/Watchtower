# Watchtower V2 — Security and Guardrails

## Authentication

Keep the existing single-user signed-session model unless a concrete requirement changes it.

## Authorization

Every server action must derive the current user from the authenticated session.

Never trust a userId supplied by the browser.

## AI Safety

The LLM is not an authorization layer.

The server decides:
- whether a tool exists;
- whether the tool is permitted;
- whether confirmation is required;
- whether the user is authenticated;
- whether the arguments are valid.

## External Actions

Calendar/email/message actions:
- preview;
- confirmation;
- execution;
- audit.

## Prompt Injection

Treat retrieved documents, news, imported conversations and external content as untrusted data.

Never allow retrieved content to override:
- system policies;
- tool permissions;
- user authorization;
- confirmation requirements.

## Data Privacy

Do not send unnecessary personal data to the LLM.

Context should be:
- minimal;
- relevant;
- structured.

Do not include:
- OAuth tokens;
- session secrets;
- internal credentials;
- unnecessary private records.

## Logging

Safe:
- tool name;
- success/failure;
- latency;
- action ID;
- provider;
- high-level error.

Unsafe:
- API keys;
- refresh tokens;
- session secrets;
- full sensitive payloads.

## Memory

A model-generated statement is not automatically truth.

Durable memory requires:
- source;
- confidence;
- provenance;
- appropriate approval.

## Failure Mode

If uncertain:
- ask;
- propose;
- or do nothing.

Never fabricate execution.
