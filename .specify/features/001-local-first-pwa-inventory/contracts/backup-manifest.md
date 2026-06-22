# Contract: Backup Manifest

## Format

Backups use a JSON manifest plus compressed image files. CSV export is a secondary tabular export and is not sufficient for full restore.

```json
{
  "schema_version": 1,
  "exported_at": "2026-06-22T00:00:00Z",
  "household_id": "uuid",
  "entities": {
    "items": [],
    "locations": [],
    "tags": [],
    "item_tags": [],
    "photos": [],
    "history": []
  },
  "files": [
    {
      "photo_id": "uuid",
      "kind": "main",
      "path": "photos/<photo_id>/main.webp",
      "mime_type": "image/webp",
      "byte_size": 12345,
      "exif_stripped": true,
      "original_retained": false
    }
  ]
}
```

## Restore Rules

- Validate `schema_version` before import.
- Refuse manifests containing `original_retained: true` for MVP restore.
- Restore must dry-run and report entity counts before mutating local data.
- Restored records must remain household-scoped and must not bypass membership checks when synced.
