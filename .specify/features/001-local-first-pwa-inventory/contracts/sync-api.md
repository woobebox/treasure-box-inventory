# Contract: Supabase Edge Function Sync API

## Authentication

- All endpoints require Supabase Auth JWT.
- Server must derive `user_id` from the JWT, not from client payload.
- Every request must include `household_id`; server must verify active membership.

## POST /sync/push

Push pending household-scoped SyncOps.

### Request

```json
{
  "household_id": "uuid",
  "device_id": "device-uuid-or-random-id",
  "ops": [
    {
      "id": "uuid",
      "op_type": "item.create",
      "entity_type": "items",
      "entity_id": "uuid",
      "base_version": 0,
      "payload": {},
      "created_at": "2026-06-22T00:00:00Z"
    }
  ]
}
```

### Response

```json
{
  "cursor": "opaque-change-cursor",
  "acks": [
    {
      "op_id": "uuid",
      "entity_id": "uuid",
      "status": "synced",
      "server_version": 1
    }
  ],
  "conflicts": []
}
```

### Security Requirements

- Reject cross-household payloads.
- Reject delete/restore/member-management ops from non-admin members.
- Validate `base_version` before writes.
- Write rows and history in a transaction.

## GET /sync/changes

Pull household-scoped changes since a cursor.

### Query

```text
/sync/changes?household_id=<uuid>&device_id=<id>&cursor=<opaque>
```

### Response

```json
{
  "cursor": "next-opaque-change-cursor",
  "changes": [
    {
      "entity_type": "items",
      "entity_id": "uuid",
      "version": 2,
      "deleted_at": null,
      "payload": {}
    }
  ]
}
```

### Security Requirements

- Return only rows for households where the authenticated user is an active member.
- Do not return original photo objects or EXIF metadata.
