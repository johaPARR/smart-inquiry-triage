# n8n - Smart Inquiry Triage

This folder contains the n8n automation for the Smart Inquiry Triage API.

## Workflow

`workflows/smart-inquiry-triage.json`

The workflow:

1. Receives a consultation through an HTTP POST webhook.
2. Sends the payload to the Node.js API.
3. Returns the API response to the webhook caller.

## Requirements

- n8n running in Docker.
- Smart Inquiry Triage API running on port 3100.
- MongoDB connected to the API.
- A valid API key configured in the backend environment.

## Import

1. Open the n8n editor.
2. Select **Import from File**.
3. Choose `workflows/smart-inquiry-triage.json`.
4. Open the **Send to Backend** node.
5. Replace `REEMPLAZAR_CON_API_KEY` with the value of `API_KEY` configured in the backend `.env`.
6. Save the workflow.

Do not commit real API keys or credentials to Git.

## Webhook

HTTP method: `POST`

Path: `/webhook/smart-inquiry-triage`

Local URL, when the workflow is active:

`http://localhost:5678/webhook/smart-inquiry-triage`

For manual testing in n8n, use the test URL displayed by the Webhook node while listening for a test event.

## Example payload

See `examples/webhook-payload.json`.

Each request must include a unique `externalId` to identify the consultation. Reusing an existing `externalId` triggers the API's idempotency behavior.

## Backend connection

The HTTP Request node uses:

`http://host.docker.internal:3100/api/consultas`

This hostname allows the n8n container to reach the API published by Docker Desktop on the Windows host.

## Current scope

This initial workflow handles webhook reception, backend submission, and response delivery. Telegram notifications, urgency-based routing, and dedicated error branches are planned for the next iteration and must be tested before being considered implemented.

