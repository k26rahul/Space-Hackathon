### Summary of Problem Statement

Cargo management on the International Space Station (ISS) is time-consuming, taking up 25% of astronauts' time. The task is to develop a software solution to automate stowage operations. It must optimize item placement, retrieval, rearrangement, waste disposal, and cargo return while logging actions. The system should be efficient, Docker-based, and include a functional UI. Key challenges include handling space constraints, prioritizing high-priority items, and minimizing retrieval steps.

### Technical Introduction

The software manages cuboidal storage containers with an "open face" for access. Items have attributes like dimensions, priority, expiry dates, and usage limits. Algorithms must efficiently place items, suggest retrievals (minimizing steps), and rearrange cargo when space is tight. Waste items (expired or depleted) are tracked and prepared for return. The system uses a RESTful API on port 8000, deployed via Docker (Ubuntu:22.04 base image), and includes a frontend. Time simulation aids mission planning.

---

### Detailed API Routes

Below is a complete list of required API routes, their purpose, request bodies, and responses.

#### 1. Placement Recommendations API

- **Endpoint**: `/api/placement`
- **Method**: POST
- **Purpose**: Suggests optimal placement for new items, considering space, priority, and preferred zones. Recommends rearrangements if needed.
- **Request Body**:
  ```json
  {
    "items": [
      {
        "itemId": "string",
        "name": "string",
        "width": number,
        "depth": number,
        "height": number,
        "priority": number,
        "expiryDate": "string", // ISO format
        "usageLimit": number,
        "preferredZone": "string"
      }
    ],
    "containers": [
      {
        "containerId": "string",
        "zone": "string",
        "width": number,
        "depth": number,
        "height": number
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": boolean,
    "placements": [
      {
        "itemId": "string",
        "containerId": "string",
        "position": {
          "startCoordinates": { "width": number, "depth": number, "height": number },
          "endCoordinates": { "width": number, "depth": number, "height": number }
        },
        "rearrangements": [
          {
            "step": number,
            "action": "string", // "move", "remove", "place"
            "itemId": "string",
            "fromContainer": "string",
            "fromPosition": {
              "startCoordinates": { "width": number, "depth": number, "height": number },
              "endCoordinates": { "width": number, "depth": number, "height": number }
            },
            "toContainer": "string",
            "toPosition": {
              "startCoordinates": { "width": number, "depth": number, "height": number },
              "endCoordinates": { "width": number, "depth": number, "height": number }
            }
          }
        ]
      }
    ]
  }
  ```

#### 2. Item Search API

- **Endpoint**: `/api/search`
- **Method**: GET
- **Purpose**: Locates an item by ID or name, providing retrieval instructions.
- **Query Parameters**:
  - `itemId`: string (optional)
  - `itemName`: string (optional, either ID or name required)
  - `userId`: string (optional)
- **Response**:
  ```json
  {
    "success": boolean,
    "found": boolean,
    "item": {
      "itemId": "string",
      "name": "string",
      "containerId": "string",
      "zone": "string",
      "position": {
        "startCoordinates": { "width": number, "depth": number, "height": number },
        "endCoordinates": { "width": number, "depth": number, "height": number }
      },
      "retrievalSteps": [
        {
          "step": number,
          "action": "string", // "remove", "setAside", "retrieve", "placeBack"
          "itemId": "string",
          "itemName": "string"
        }
      ]
    }
  }
  ```

#### 3. Item Retrieval API

- **Endpoint**: `/api/retrieve`
- **Method**: POST
- **Purpose**: Logs an item retrieval, reducing its usage count by 1.
- **Request Body**:
  ```json
  {
    "itemId": "string",
    "userId": "string",
    "timestamp": "string" // ISO format
  }
  ```
- **Response**:
  ```json
  {
    "success": boolean
  }
  ```

#### 4. Item Placement API

- **Endpoint**: `/api/place`
- **Method**: POST
- **Purpose**: Updates an item’s location after manual placement by an astronaut.
- **Request Body**:
  ```json
  {
    "itemId": "string",
    "userId": "string",
    "timestamp": "string", // ISO format
    "containerId": "string",
    "position": {
      "startCoordinates": { "width": number, "depth": number, "height": number },
      "endCoordinates": { "width": number, "depth": number, "height": number }
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": boolean
  }
  ```

#### 5. Waste Identification API

- **Endpoint**: `/api/waste/identify`
- **Method**: GET
- **Purpose**: Identifies expired or depleted items as waste.
- **Request Body**: None
- **Response**:
  ```json
  {
    "success": boolean,
    "wasteItems": [
      {
        "itemId": "string",
        "name": "string",
        "reason": "string", // "Expired", "Out of Uses"
        "containerId": "string",
        "position": {
          "startCoordinates": { "width": number, "depth": number, "height": number },
          "endCoordinates": { "width": number, "depth": number, "height": number }
        }
      }
    ]
  }
  ```

#### 6. Waste Return Plan API

- **Endpoint**: `/api/waste/return-plan`
- **Method**: POST
- **Purpose**: Plans waste movement to an undocking container, respecting weight limits.
- **Request Body**:
  ```json
  {
    "undockingContainerId": "string",
    "undockingDate": "string", // ISO format
    "maxWeight": number
  }
  ```
- **Response**:
  ```json
  {
    "success": boolean,
    "retrievalSteps": [
      {
        "step": number,
        "action": "string", // "remove", "setAside", "retrieve", "placeBack"
        "itemId": "string",
        "itemName": "string"
      }
    ],
    "returnManifest": {
      "undockingContainerId": "string",
      "undockingDate": "string",
      "returnItems": [
        {
          "itemId": "string",
          "name": "string",
          "reason": "string"
        }
      ],
      "totalVolume": number,
      "totalWeight": number
    }
  }
  ```

#### 7. Complete Undocking API

- **Endpoint**: `/api/waste/complete-undocking`
- **Method**: POST
- **Purpose**: Finalizes waste removal and frees up space.
- **Request Body**:
  ```json
  {
    "undockingContainerId": "string",
    "timestamp": "string" // ISO format
  }
  ```
- **Response**:
  ```json
  {
    "success": boolean,
    "itemsRemoved": number
  }
  ```

#### 8. Time Simulation API

- **Endpoint**: `/api/simulate/day`
- **Method**: POST
- **Purpose**: Simulates days passing, updating item statuses (e.g., expiry, usage).
- **Request Body**:
  ```json
  {
    "numOfDays": number, // Either this or toTimestamp
    "toTimestamp": "string", // ISO format
    "itemsToBeUsedPerDay": [
      {
        "itemId": "string",
        "name": "string" // Either of these
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": boolean,
    "newDate": "string", // ISO format
    "changes": {
      "itemsUsed": [
        {
          "itemId": "string",
          "name": "string"
        }
      ],
      "itemsDepletedToday": [
        {
          "itemId": "string",
          "name": "string"
        }
      ]
    }
  }
  ```

#### 9. Import Items API

- **Endpoint**: `/api/import/items`
- **Method**: POST
- **Purpose**: Imports item data from a CSV file.
- **Request Body**: Form data with CSV file upload
- **Response**:
  ```json
  {
    "success": boolean,
    "itemsImported": number,
    "errors": [
      {
        "row": number,
        "message": "string"
      }
    ]
  }
  ```

#### 10. Import Containers API

- **Endpoint**: `/api/import/containers` -。そんな Method\*\*: POST
- **Purpose**: Imports container data from a CSV file.
- **Request Body**: Form data with CSV file upload
- **Response**:
  ```json
  {
    "success": boolean,
    "containersImported": number,
    "errors": [
      {
        "row": number,
        "message": "string"
      }
    ]
  }
  ```

#### 11. Export Arrangement API

- **Endpoint**: `/api/export/arrangement`
- **Method**: GET
- **Purpose**: Exports current item arrangement as a CSV file.
- **Request Body**: None
- **Response**: CSV file download
  ```
  Item ID,Container ID,Coordinates (W1,D1,H1),(W2,D2,H2)
  001,contA,(0,0,0),(10,10,20)
  002,contB,(0,0,0),(15,15,50)
  ```

#### 12. Logging API

- **Endpoint**: `/api/logs`
- **Method**: GET
- **Purpose**: Retrieves logs of actions (placement, retrieval, etc.).
- **Query Parameters**:
  - `startDate`: string (ISO format)
  - `endDate`: string (ISO format)
  - `itemId`: string (optional)
  - `userId`: string (optional)
  - `actionType`: string (optional) - "placement", "retrieval", "rearrangement", "disposal"
- **Response**:
  ```json
  {
    "logs": [
      {
        "timestamp": "string",
        "userId": "string",
        "actionType": "string",
        "itemId": "string",
        "details": {
          "fromContainer": "string",
          "toContainer": "string",
          "reason": "string"
        }
      }
    ]
  }
  ```

---

This document outlines the problem, technical basics, and all required API routes with their purposes, requests, and responses. Use this to guide development. Let me know if you need code snippets or further clarification!
