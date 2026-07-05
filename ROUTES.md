# API Routes

This document describes the current backend API endpoints.

Base URL:
- http://127.0.0.1:3001/api

---

## Federation Nodes

### Get all federation nodes
- Endpoint: `GET /api/federation-nodes`
- Description: Returns all federation nodes that are not soft deleted.

Example:
```bash
curl http://127.0.0.1:3001/api/federation-nodes
```

---

### Get a federation node by ID
- Endpoint: `GET /api/federation-nodes/:id`
- Description: Returns a single federation node by UUID, including parent, children, forms, and users.

Example:
```bash
curl http://127.0.0.1:3001/api/federation-nodes/8094cda1-2010-42aa-afe8-fb5146352343
```

---

### Create a federation node
- Endpoint: `POST /api/federation-nodes`
- Description: Creates a new federation node.
- Request body:
```json
{
  "name": "National Federation",
  "parentId": null,
  "isActive": true
}
```

Example:
```bash
curl -X POST http://127.0.0.1:3001/api/federation-nodes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "National Federation",
    "parentId": null,
    "isActive": true
  }'
```

---

### Update a federation node
- Endpoint: `PUT /api/federation-nodes/:id`
- Description: Updates an existing federation node.
- Request body:
```json
{
  "name": "National Federation Updated",
  "isActive": false
}
```

Example:
```bash
curl -X PUT http://127.0.0.1:3001/api/federation-nodes/8094cda1-2010-42aa-afe8-fb5146352343 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "National Federation Updated",
    "isActive": false
  }'
```

---

## Federation Forms

### Get all forms
- Endpoint: `GET /api/forms`
- Description: Returns all forms with their nested fields.

Example:
```bash
curl http://127.0.0.1:3001/api/forms
```

---

### Get form by ID
- Endpoint: `GET /api/forms/:id`
- Description: Returns a single form by UUID with its fields.

Example:
```bash
curl http://127.0.0.1:3001/api/forms/59afa937-3004-4a83-a7de-e88ac8149936
```

---

### Create a form
- Endpoint: `POST /api/forms`
- Description: Creates a new form and nested fields in one request.
- Request body:
```json
{
  "federationNodeId": "38777c39-75a3-4459-a032-74c0bcca8a7d",
  "name": "Sample Form",
  "version": 1,
  "isActive": true,
  "fields": [
    {
      "fieldKey": "email",
      "label": "Email",
      "fieldType": "EMAIL",
      "isRequired": true,
      "sortOrder": 1
    },
    {
      "fieldKey": "age",
      "label": "Age",
      "fieldType": "NUMBER",
      "isRequired": false,
      "sortOrder": 2
    }
  ]
}
```

Example:
```bash
curl -X POST http://127.0.0.1:3001/api/forms \
  -H "Content-Type: application/json" \
  -d '{
    "federationNodeId": "38777c39-75a3-4459-a032-74c0bcca8a7d",
    "name": "Sample Form",
    "version": 1,
    "isActive": true,
    "fields": [
      {
        "fieldKey": "email",
        "label": "Email",
        "fieldType": "EMAIL",
        "isRequired": true,
        "sortOrder": 1
      },
      {
        "fieldKey": "age",
        "label": "Age",
        "fieldType": "NUMBER",
        "isRequired": false,
        "sortOrder": 2
      }
    ]
  }'
```

---

### Update a form
- Endpoint: `PUT /api/forms/:id`
- Description: Updates form metadata and synchronizes nested fields.
- Request body example:
```json
{
  "name": "Sample Form Updated",
  "version": 2,
  "isActive": false,
  "fields": [
    {
      "id": "27f1369c-530a-478b-bf74-ba5497d799aa",
      "fieldKey": "email",
      "label": "Primary Email",
      "fieldType": "EMAIL",
      "isRequired": true,
      "sortOrder": 1
    },
    {
      "fieldKey": "phone",
      "label": "Phone",
      "fieldType": "PHONE",
      "isRequired": false,
      "sortOrder": 2
    }
  ]
}
```

Example:
```bash
curl -X PUT http://127.0.0.1:3001/api/forms/59afa937-3004-4a83-a7de-e88ac8149936 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Form Updated",
    "version": 2,
    "isActive": false,
    "fields": [
      {
        "id": "27f1369c-530a-478b-bf74-ba5497d799aa",
        "fieldKey": "email",
        "label": "Primary Email",
        "fieldType": "EMAIL",
        "isRequired": true,
        "sortOrder": 1
      },
      {
        "fieldKey": "phone",
        "label": "Phone",
        "fieldType": "PHONE",
        "isRequired": false,
        "sortOrder": 2
      }
    ]
  }'
```

---

## Approval Statuses

### Get all approval statuses
- Endpoint: `GET /api/approval-statuses`
- Description: Returns all approval status records.

Example:
```bash
curl http://127.0.0.1:3001/api/approval-statuses
```

---

### Get approval status by ID
- Endpoint: `GET /api/approval-statuses/:id`
- Description: Returns a single approval status record.

Example:
```bash
curl http://127.0.0.1:3001/api/approval-statuses/1
```

---

### Create an approval status
- Endpoint: `POST /api/approval-statuses`
- Description: Creates a new approval status.
- Request body:
```json
{
  "name": "Pending",
  "value": 1
}
```

Example:
```bash
curl -X POST http://127.0.0.1:3001/api/approval-statuses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pending",
    "value": 1
  }'
```

---

### Update an approval status
- Endpoint: `PUT /api/approval-statuses/:id`
- Description: Updates the name and/or value of an approval status.
- Request body example:
```json
{
  "name": "Approved",
  "value": 2
}
```

Example:
```bash
curl -X PUT http://127.0.0.1:3001/api/approval-statuses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Approved",
    "value": 2
  }'
```

---

### Delete an approval status
- Endpoint: `DELETE /api/approval-statuses/:id`
- Description: Deletes the approval status record.

Example:
```bash
curl -X DELETE http://127.0.0.1:3001/api/approval-statuses/1
```

---

## Federation Users

### Get all federation users
- Endpoint: `GET /api/federation-users`
- Description: Returns all federation users. Supports optional query filters:
  - `federationNodeId`
  - `formId`
  - `approvalStatus`

Example:
```bash
curl http://127.0.0.1:3001/api/federation-users
```

Example with filter:
```bash
curl "http://127.0.0.1:3001/api/federation-users?federationNodeId=38777c39-75a3-4459-a032-74c0bcca8a7d"
```

---

### Get a federation user by ID
- Endpoint: `GET /api/federation-users/:id`
- Description: Returns a specific federation user.

Example:
```bash
curl http://127.0.0.1:3001/api/federation-users/1b53b56a-6f26-4eff-a11d-d670aaa48d14
```

---

### Create a federation user
- Endpoint: `POST /api/federation-users`
- Description: Creates a federation user record.
- Request body:
```json
{
  "federationNodeId": "38777c39-75a3-4459-a032-74c0bcca8a7d",
  "formId": "59afa937-3004-4a83-a7de-e88ac8149936",
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "address": "123 Main St",
  "approvalStatus": 1,
  "dynamicFields": { "age": 30 }
}
```

Example:
```bash
curl -X POST http://127.0.0.1:3001/api/federation-users \
  -H "Content-Type: application/json" \
  -d '{
    "federationNodeId": "38777c39-75a3-4459-a032-74c0bcca8a7d",
    "formId": "59afa937-3004-4a83-a7de-e88ac8149936",
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "1234567890",
    "address": "123 Main St",
    "approvalStatus": 1,
    "dynamicFields": { "age": 30 }
  }'
```

---

### Update a federation user
- Endpoint: `PUT /api/federation-users/:id`
- Description: Updates one or more federation user fields.
- Request body can contain any of:
  - `federationNodeId`
  - `formId`
  - `name`
  - `email`
  - `phoneNumber`
  - `address`
  - `approvalStatus`
  - `dynamicFields`

Example:
```bash
curl -X PUT http://127.0.0.1:3001/api/federation-users/1b53b56a-6f26-4eff-a11d-d670aaa48d14 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "phoneNumber": "5555555555"
  }'
```

---

### Delete a federation user
- Endpoint: `DELETE /api/federation-users/:id`
- Description: Deletes the federation user record.

Example:
```bash
curl -X DELETE http://127.0.0.1:3001/api/federation-users/1b53b56a-6f26-4eff-a11d-d670aaa48d14
```

---

## Notes
- API uses Prisma and PostgreSQL.
- `POST /api/forms` creates nested `FormField` records.
- `PUT /api/forms/:id` reconciles form fields by updating existing fields, creating new fields, and deleting removed ones.
- `approvalStatus` is stored as an integer value and is referenced by `FederationUser.approvalStatus`.
