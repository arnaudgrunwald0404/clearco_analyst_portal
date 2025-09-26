# Boulders API Documentation

## Overview

The Boulders API allows external tools to replicate the functionality of the Clearco Roadmap Portal's Boulders page. It provides access to "boulder" epics (significant roadmap items) organized by quarters with filtering and search capabilities.

## Base URL

```
https://dqqzbkmtbnigytsfycbz.supabase.co/functions/v1/boulders-api
```

## Authentication

All requests require authentication using a Supabase JWT token in the Authorization header:

```
Authorization: Bearer <your-supabase-jwt-token>
```

## Endpoint

### GET `/boulders-api`

Retrieves boulder epics organized by quarters with optional filtering.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | `""` | Search term to filter boulders by name or description |
| `modules` | string | `""` | Comma-separated list of modules to filter by (e.g., "TA,ONB,TD") |
| `pastQuarters` | number | `2` | Number of past quarters to include |
| `futureQuarters` | number | `3` | Number of future quarters to include |

#### Example Requests

**Basic request (all boulders):**
```bash
curl -X GET \
  "https://dqqzbkmtbnigytsfycbz.supabase.co/functions/v1/boulders-api" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**With search and module filtering:**
```bash
curl -X GET \
  "https://dqqzbkmtbnigytsfycbz.supabase.co/functions/v1/boulders-api?search=talent&modules=TA,TD&pastQuarters=1&futureQuarters=2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Format

```json
{
  "quarters": [
    {
      "quarter": "Q3 2024",
      "epics": [
        {
          "id": "EPIC-123",
          "name": "Epic Name",
          "alternate_name": "Alternate Display Name",
          "description": "Epic description",
          "status": "In Development",
          "statusComplete": false,
          "releaseDate": "2024-09-15T00:00:00.000Z",
          "release": "Release Name",
          "devRoadmap": "TA",
          "cpo_take": "CPO's perspective on this epic",
          "boulder_file_url": "https://example.com/file.jpg",
          "tags": [
            {
              "name": "Priority",
              "color": "#ff0000"
            }
          ],
          "assignedTo": "John Doe",
          "assignedToEmail": "john@example.com",
          "progressPercent": 75,
          "quarter": "Q3 2024"
        }
      ]
    }
  ],
  "availableModules": ["TA", "ONB", "TD", "R&A", "INT", "PLAT", "LMS", "CM"],
  "totalBoulders": 25,
  "filteredBoulders": 8
}
```

#### Boulder Epic Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique epic identifier |
| `name` | string | Epic name |
| `alternate_name` | string | Display name (if different from name) |
| `description` | string | Epic description |
| `status` | string | Current status (e.g., "In Development", "Done") |
| `statusComplete` | boolean | Whether the epic is completed |
| `releaseDate` | string | Target release date (ISO format) |
| `release` | string | Release name |
| `devRoadmap` | string | Module/R&D Pod (TA, ONB, TD, etc.) |
| `cpo_take` | string | CPO's perspective/notes |
| `boulder_file_url` | string | URL to associated file/image |
| `tags` | array | Array of tag objects with name and color |
| `assignedTo` | string | Assigned person's name |
| `assignedToEmail` | string | Assigned person's email |
| `progressPercent` | number | Completion percentage |
| `quarter` | string | Computed quarter (e.g., "Q3 2024") |

## Module Aliases

The API recognizes these module aliases:

| Full Name | Alias |
|-----------|-------|
| Talent Acquisition | TA |
| Onboarding/Emp Events | ONB |
| Talent Development | TD |
| Reporting & Analytics | R&A |
| Integration | INT |
| Platform | PLAT |
| LMS | LMS |
| Compensation Management | CM |

## Error Handling

### HTTP Status Codes

- `200` - Success
- `401` - Unauthorized (invalid or missing JWT token)
- `500` - Internal server error

### Error Response Format

```json
{
  "error": "Error message description"
}
```

## Step-by-Step Integration Guide

### Step 1: Obtain Authentication Token

You need a valid Supabase JWT token. This can be obtained by:

1. **User Authentication**: Have users sign in through your application
2. **Service Key**: Use a service role key for server-to-server communication
3. **Existing Session**: If integrating within the same Supabase project

### Step 2: Make API Request

```javascript
// Example using fetch in JavaScript
async function fetchBoulders(options = {}) {
  const {
    search = '',
    modules = [],
    pastQuarters = 2,
    futureQuarters = 3
  } = options;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (modules.length) params.append('modules', modules.join(','));
  params.append('pastQuarters', pastQuarters.toString());
  params.append('futureQuarters', futureQuarters.toString());

  const response = await fetch(
    `https://dqqzbkmtbnigytsfycbz.supabase.co/functions/v1/boulders-api?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${yourJwtToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return await response.json();
}

// Usage
const boulders = await fetchBoulders({
  search: 'talent',
  modules: ['TA', 'TD'],
  pastQuarters: 1,
  futureQuarters: 2
});
```

### Step 3: Process the Response

```javascript
// Display boulders by quarter
boulders.quarters.forEach(quarterGroup => {
  console.log(`\n${quarterGroup.quarter}:`);
  
  if (quarterGroup.epics.length === 0) {
    console.log('  No boulders scheduled for this quarter');
    return;
  }

  quarterGroup.epics.forEach(epic => {
    console.log(`  - ${epic.alternate_name || epic.name}`);
    console.log(`    Status: ${epic.status}`);
    console.log(`    Module: ${epic.devRoadmap}`);
    if (epic.cpo_take) {
      console.log(`    CPO's Take: ${epic.cpo_take.substring(0, 100)}...`);
    }
  });
});

console.log(`\nTotal: ${boulders.filteredBoulders} of ${boulders.totalBoulders} boulders`);
```

### Step 4: Handle Different Content Types

```javascript
// Handle boulder files (images, videos, presentations)
function renderBoulderFile(epic) {
  if (!epic.boulder_file_url) return null;

  const fileUrl = epic.boulder_file_url;
  
  if (fileUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return `<img src="${fileUrl}" alt="${epic.name}" />`;
  } else if (fileUrl.match(/\.(mp4)$/i)) {
    return `<video src="${fileUrl}" controls />`;
  } else if (fileUrl.match(/\.(ppt|pptx)$/i)) {
    return `<a href="${fileUrl}" target="_blank">View Presentation</a>`;
  }
  
  return `<a href="${fileUrl}" target="_blank">View File</a>`;
}
```

## Rate Limiting

The API inherits Supabase's default rate limiting. For high-volume usage, consider:

- Caching responses locally
- Implementing request throttling
- Using webhooks for real-time updates (if needed)

## Support

For questions or issues with the Boulders API, please contact the development team or create an issue in the project repository.
