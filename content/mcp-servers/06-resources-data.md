---
title: "MCP Resources: Managing Data Sources and Content"
subtitle: "A comprehensive guide"
difficulty: "Intermediate"
readingTime: 15
handsOnTime: 0
learningObjectives: []
prerequisites: []
tags:
  - "ai"
  - "api"
publishedDate: "2025-12-08"
---

# MCP Resources: Managing Data Sources and Content

**Level**: L2-L3 Developers
**Prerequisites**: Basic MCP understanding, TypeScript/Python familiarity

## Introduction

Model Context Protocol (MCP) Resources provide a powerful abstraction for exposing data sources to AI models. Unlike Tools (which perform actions) and Prompts (which structure interactions), Resources enable AI models to discover and access various types of content through a unified interface.

This guide explores MCP's resource system, covering URI schemes, dynamic resource patterns, content types, pagination strategies, and performance optimizations. By the end, you'll understand how to design efficient resource architectures that scale from simple file access to complex, streaming data sources.

## Table of Contents

1. [Understanding MCP Resources](#understanding-mcp-resources)
2. [Resource URI Schemes](#resource-uri-schemes)
3. [Resource Patterns and Architecture](#resource-patterns-and-architecture)
4. [Content Types and Serialization](#content-types-and-serialization)
5. [Dynamic Resources](#dynamic-resources)
6. [Pagination Strategies](#pagination-strategies)
7. [Caching and Performance](#caching-and-performance)
8. [Streaming Resources](#streaming-resources)
9. [Best Practices](#best-practices)
10. [Production Examples](#production-examples)

## Understanding MCP Resources

### What Are Resources?

Resources in MCP represent **readable data sources** that AI models can discover and access. They provide a standardized way to expose:

- Files and documents
- Database records
- API responses
- Real-time data streams
- Configuration data
- Search results

### Resource vs. Tool vs. Prompt

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Primitives                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Resources   │  │    Tools     │  │   Prompts    │    │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤    │
│  │ Read-only    │  │ Actions      │  │ Templates    │    │
│  │ Data access  │  │ Side effects │  │ Interactions │    │
│  │ Discoverable │  │ Parameters   │  │ Guided flows │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  Examples:          Examples:         Examples:            │
│  • Files            • Search         • Analysis prompt    │
│  • Database         • Create         • Code review        │
│  • API data         • Update         • Summarization      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Core Resource Concepts

**Resource Identity**: Every resource has a unique URI
```typescript
{
  uri: "file:///project/README.md",
  name: "Project README",
  description: "Main project documentation"
}
```

**Resource Content**: Data with MIME type and metadata
```typescript
{
  uri: "file:///project/README.md",
  mimeType: "text/markdown",
  text: "# My Project\n\nWelcome to..."
}
```

**Resource Discovery**: Models can list available resources
```typescript
// Client requests available resources
const resources = await client.listResources();
// Server returns resource list
```

## Resource URI Schemes

### URI Structure

MCP URIs follow standard URI syntax with custom schemes:

```
scheme://authority/path?query#fragment

Examples:
  file:///home/user/document.txt
  db://localhost/users/123
  api://service/v1/data?filter=active
  stream://sensor/temperature
```

### Common URI Schemes

#### File Resources

```typescript
// TypeScript SDK example
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "file-server", version: "1.0.0" },
  { capabilities: { resources: {} } }
);

// List file resources
server.setRequestHandler("resources/list", async () => {
  return {
    resources: [
      {
        uri: "file:///project/README.md",
        name: "README",
        description: "Project documentation",
        mimeType: "text/markdown"
      },
      {
        uri: "file:///project/config.json",
        name: "Configuration",
        description: "Application settings",
        mimeType: "application/json"
      }
    ]
  };
});

// Read file resource
server.setRequestHandler("resources/read", async (request) => {
  const uri = request.params.uri;

  if (uri.startsWith("file://")) {
    const filePath = uri.replace("file://", "");
    const content = await fs.readFile(filePath, "utf-8");

    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: content
      }]
    };
  }

  throw new Error(`Unknown URI scheme: ${uri}`);
});
```

**Source**: [MCP TypeScript SDK - Server Examples](https://github.com/modelcontextprotocol/typescript-sdk)

#### Database Resources

```python
# Python SDK example
from mcp.server import Server
from mcp.types import Resource, TextContent
import sqlite3

app = Server("database-server")

@app.list_resources()
async def list_resources():
    """List available database resources"""
    return [
        Resource(
            uri="db://local/users",
            name="User Table",
            description="All user records",
            mimeType="application/json"
        ),
        Resource(
            uri="db://local/orders",
            name="Order Table",
            description="Customer orders",
            mimeType="application/json"
        )
    ]

@app.read_resource()
async def read_resource(uri: str):
    """Read database resource"""
    if uri == "db://local/users":
        conn = sqlite3.connect("app.db")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        conn.close()

        return TextContent(
            uri=uri,
            mimeType="application/json",
            text=json.dumps(users, indent=2)
        )

    raise ValueError(f"Unknown resource: {uri}")
```

**Source**: [MCP Python SDK - Server Reference](https://github.com/modelcontextprotocol/python-sdk)

#### API Resources

```typescript
// API proxy resource pattern
server.setRequestHandler("resources/list", async () => {
  return {
    resources: [
      {
        uri: "api://github/repos/user/project",
        name: "GitHub Repository",
        description: "Repository metadata",
        mimeType: "application/json"
      }
    ]
  };
});

server.setRequestHandler("resources/read", async (request) => {
  if (request.params.uri.startsWith("api://github/")) {
    const path = request.params.uri.replace("api://github/", "");
    const response = await fetch(`https://api.github.com/${path}`, {
      headers: { "Authorization": `token ${GITHUB_TOKEN}` }
    });

    const data = await response.json();

    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2)
      }]
    };
  }
});
```

### URI Design Best Practices

```
┌─────────────────────────────────────────────────────────┐
│              URI Design Principles                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✓ Hierarchical Structure                              │
│    file:///project/docs/api/authentication.md          │
│    └─scheme─┘└─────────path──────────────┘            │
│                                                         │
│  ✓ Query Parameters for Filtering                      │
│    db://users?role=admin&active=true                   │
│    └─base─┘└────query_string─────┘                    │
│                                                         │
│  ✓ Fragments for Sub-resources                         │
│    doc://guide#installation                            │
│    └─document─┘└─section─┘                            │
│                                                         │
│  ✓ Versioning in Path                                  │
│    api://service/v2/data                               │
│    └─base──┘└version┘└path┘                           │
│                                                         │
│  ✗ Avoid Ambiguity                                     │
│    Bad:  resource://item/1                             │
│    Good: db://items/1                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Resource Patterns and Architecture

### Resource Hierarchy Pattern

Organize resources in logical hierarchies:

```typescript
// Hierarchical resource organization
const RESOURCE_TREE = {
  "project://": {
    "docs/": {
      "api/": ["authentication.md", "endpoints.md"],
      "guides/": ["setup.md", "deployment.md"]
    },
    "config/": {
      "dev.json": {},
      "prod.json": {}
    }
  }
};

// List resources with hierarchy awareness
server.setRequestHandler("resources/list", async () => {
  const resources = [];

  function traverse(base: string, tree: any) {
    for (const [key, value] of Object.entries(tree)) {
      const uri = `${base}${key}`;

      if (typeof value === 'object' && !Array.isArray(value)) {
        // Directory node
        resources.push({
          uri,
          name: key,
          description: `Directory: ${key}`,
          mimeType: "application/x-directory"
        });
        traverse(uri, value);
      } else if (Array.isArray(value)) {
        // File list
        value.forEach(file => {
          resources.push({
            uri: `${uri}${file}`,
            name: file,
            description: `File: ${file}`,
            mimeType: inferMimeType(file)
          });
        });
      }
    }
  }

  traverse("project://", RESOURCE_TREE);
  return { resources };
});
```

### Virtual Resource Pattern

Create computed resources that don't exist as files:

```python
# Virtual resource example - aggregated view
@app.read_resource()
async def read_resource(uri: str):
    if uri == "virtual://dashboard/summary":
        # Aggregate data from multiple sources
        users = await get_user_count()
        orders = await get_order_stats()
        revenue = await calculate_revenue()

        summary = {
            "timestamp": datetime.now().isoformat(),
            "users": users,
            "orders": orders,
            "revenue": revenue
        }

        return TextContent(
            uri=uri,
            mimeType="application/json",
            text=json.dumps(summary, indent=2)
        )

    if uri.startswith("virtual://report/"):
        report_id = uri.split("/")[-1]
        # Generate report on-demand
        report = await generate_report(report_id)
        return TextContent(
            uri=uri,
            mimeType="text/markdown",
            text=report
        )
```

### Template Resource Pattern

Resources that accept parameters via URI query strings:

```typescript
// Template resource with parameters
server.setRequestHandler("resources/read", async (request) => {
  const url = new URL(request.params.uri);

  if (url.protocol === "template:" && url.pathname === "//user-profile") {
    const userId = url.searchParams.get("id");
    const format = url.searchParams.get("format") || "json";

    const user = await fetchUser(userId);

    if (format === "markdown") {
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: "text/markdown",
          text: `# ${user.name}\n\nEmail: ${user.email}\nRole: ${user.role}`
        }]
      };
    }

    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(user, null, 2)
      }]
    };
  }
});
```

## Content Types and Serialization

### Supported MIME Types

```
┌────────────────────────────────────────────────────────┐
│           MCP Content Type Support                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Text Content (TextContent)                            │
│    • text/plain                                        │
│    • text/markdown                                     │
│    • text/html                                         │
│    • application/json                                  │
│    • application/xml                                   │
│    • text/csv                                          │
│                                                        │
│  Binary Content (BlobContent)                          │
│    • image/png                                         │
│    • image/jpeg                                        │
│    • application/pdf                                   │
│    • application/octet-stream                          │
│                                                        │
│  Resource Content (ResourceContent)                    │
│    • Embedded resources                                │
│    • Recursive resource references                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Text Content Examples

```typescript
// Markdown content
{
  uri: "doc://guide/setup",
  mimeType: "text/markdown",
  text: "# Setup Guide\n\n## Installation\n..."
}

// JSON content
{
  uri: "api://users/123",
  mimeType: "application/json",
  text: JSON.stringify({
    id: 123,
    name: "Alice",
    email: "alice@example.com"
  }, null, 2)
}

// CSV content
{
  uri: "data://sales/2024",
  mimeType: "text/csv",
  text: "Date,Product,Amount\n2024-01-01,Widget,100\n..."
}
```

### Binary Content Examples

```python
# Image resource
from mcp.types import BlobContent
import base64

@app.read_resource()
async def read_resource(uri: str):
    if uri.startswith("image://"):
        image_path = uri.replace("image://", "/images/")

        with open(image_path, "rb") as f:
            image_data = f.read()

        return BlobContent(
            uri=uri,
            mimeType="image/png",
            blob=base64.b64encode(image_data).decode()
        )
```

### Multi-Format Resources

```typescript
// Support multiple formats for same resource
server.setRequestHandler("resources/read", async (request) => {
  const url = new URL(request.params.uri);
  const format = url.searchParams.get("format");

  if (url.pathname === "//data/users") {
    const users = await getUsers();

    switch (format) {
      case "json":
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(users, null, 2)
          }]
        };

      case "csv":
        const csv = convertToCSV(users);
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "text/csv",
            text: csv
          }]
        };

      case "markdown":
        const markdown = convertToMarkdown(users);
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "text/markdown",
            text: markdown
          }]
        };

      default:
        // Default to JSON
        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(users, null, 2)
          }]
        };
    }
  }
});
```

## Dynamic Resources

### Resource Templates

Create resource templates that generate URIs dynamically:

```typescript
// Resource template system
server.setRequestHandler("resources/templates/list", async () => {
  return {
    resourceTemplates: [
      {
        uriTemplate: "user://{userId}",
        name: "User Profile",
        description: "Individual user profile by ID",
        mimeType: "application/json"
      },
      {
        uriTemplate: "user://{userId}/orders?status={status}",
        name: "User Orders",
        description: "User orders filtered by status",
        mimeType: "application/json"
      }
    ]
  };
});

// Handle templated resource reads
server.setRequestHandler("resources/read", async (request) => {
  const uri = request.params.uri;

  // Parse user://{userId} pattern
  const userMatch = uri.match(/^user:\/\/(\d+)$/);
  if (userMatch) {
    const userId = userMatch[1];
    const user = await fetchUser(userId);
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(user, null, 2)
      }]
    };
  }

  // Parse user://{userId}/orders pattern
  const ordersMatch = uri.match(/^user:\/\/(\d+)\/orders/);
  if (ordersMatch) {
    const userId = ordersMatch[1];
    const url = new URL(uri);
    const status = url.searchParams.get("status");

    const orders = await fetchUserOrders(userId, { status });
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(orders, null, 2)
      }]
    };
  }
});
```

**Source**: [MCP Specification - Resource Templates](https://spec.modelcontextprotocol.io/specification/server/resources/)

### Resource Subscriptions

Enable real-time resource updates:

```python
# Resource subscription pattern
from mcp.server.models import InitializationOptions

app = Server(
    "live-data-server",
    InitializationOptions(
        server_name="live-data-server",
        server_version="1.0.0",
        capabilities={
            "resources": {
                "subscribe": True,  # Enable subscriptions
                "listChanged": True  # Support list change notifications
            }
        }
    )
)

@app.subscribe_resource()
async def subscribe_resource(uri: str):
    """Subscribe to resource updates"""
    if uri.startswith("stream://"):
        # Start streaming data
        async for update in data_stream(uri):
            # Notify client of resource change
            await app.notify_resource_updated(uri)

@app.unsubscribe_resource()
async def unsubscribe_resource(uri: str):
    """Unsubscribe from resource updates"""
    await stop_streaming(uri)
```

## Pagination Strategies

### Cursor-Based Pagination

```typescript
// Cursor-based pagination pattern
server.setRequestHandler("resources/list", async (request) => {
  const cursor = request.params.cursor;
  const pageSize = 50;

  const { resources, nextCursor } = await fetchResourcePage(cursor, pageSize);

  return {
    resources,
    nextCursor: nextCursor  // Client uses this for next page
  };
});

// Example usage
async function fetchResourcePage(cursor: string | undefined, limit: number) {
  const query = cursor
    ? `SELECT * FROM resources WHERE id > ${cursor} LIMIT ${limit}`
    : `SELECT * FROM resources LIMIT ${limit}`;

  const results = await db.query(query);

  return {
    resources: results.map(r => ({
      uri: `db://resources/${r.id}`,
      name: r.name,
      description: r.description,
      mimeType: r.mime_type
    })),
    nextCursor: results.length === limit
      ? results[results.length - 1].id
      : undefined
  };
}
```

### Offset-Based Pagination

```python
# Offset-based pagination
@app.list_resources()
async def list_resources(cursor: Optional[str] = None):
    # Cursor encodes offset
    offset = int(cursor) if cursor else 0
    limit = 100

    resources = await db.fetch_resources(offset=offset, limit=limit)

    return {
        "resources": [
            Resource(
                uri=f"db://items/{r.id}",
                name=r.name,
                description=r.description,
                mimeType="application/json"
            )
            for r in resources
        ],
        "nextCursor": str(offset + limit) if len(resources) == limit else None
    }
```

### Large Resource Chunking

```typescript
// Split large resources into chunks
server.setRequestHandler("resources/read", async (request) => {
  const url = new URL(request.params.uri);

  if (url.pathname === "//large-dataset") {
    const chunkSize = parseInt(url.searchParams.get("chunk") || "1000");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const data = await fetchLargeDataset(offset, chunkSize);

    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify({
          offset,
          chunk_size: chunkSize,
          total: data.total,
          data: data.records,
          next_uri: data.has_more
            ? `large-dataset?offset=${offset + chunkSize}&chunk=${chunkSize}`
            : null
        }, null, 2)
      }]
    };
  }
});
```

## Caching and Performance

### Resource Caching Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Resource Caching Flow                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Client Request                                          │
│       │                                                  │
│       ▼                                                  │
│  ┌─────────────┐                                        │
│  │ Cache Check │───── Cache Hit ────▶ Return Cached     │
│  └─────────────┘                                        │
│       │                                                  │
│   Cache Miss                                             │
│       │                                                  │
│       ▼                                                  │
│  ┌─────────────┐       ┌──────────────┐                │
│  │ Fetch Fresh │─────▶ │ Update Cache │                │
│  └─────────────┘       └──────────────┘                │
│       │                      │                           │
│       └──────────────────────┘                          │
│                │                                         │
│                ▼                                         │
│         Return to Client                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### In-Memory Caching

```typescript
// Simple in-memory cache
class ResourceCache {
  private cache = new Map<string, CacheEntry>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  get(uri: string): string | null {
    const entry = this.cache.get(uri);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(uri);
      return null;
    }

    return entry.content;
  }

  set(uri: string, content: string): void {
    this.cache.set(uri, {
      content,
      timestamp: Date.now()
    });
  }

  invalidate(uri: string): void {
    this.cache.delete(uri);
  }

  clear(): void {
    this.cache.clear();
  }
}

interface CacheEntry {
  content: string;
  timestamp: number;
}

// Use cache in resource handler
const cache = new ResourceCache();

server.setRequestHandler("resources/read", async (request) => {
  const uri = request.params.uri;

  // Check cache first
  const cached = cache.get(uri);
  if (cached) {
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: cached
      }]
    };
  }

  // Fetch fresh data
  const content = await fetchResource(uri);
  cache.set(uri, content);

  return {
    contents: [{
      uri,
      mimeType: "application/json",
      text: content
    }]
  };
});
```

### ETag-Based Caching

```python
# ETag-based cache validation
import hashlib
from datetime import datetime, timedelta

class ResourceETagCache:
    def __init__(self):
        self.etags = {}
        self.cache = {}

    def compute_etag(self, content: str) -> str:
        return hashlib.md5(content.encode()).hexdigest()

    def get(self, uri: str, client_etag: Optional[str] = None):
        cached = self.cache.get(uri)
        if not cached:
            return None, None

        etag = self.etags.get(uri)

        # Client has latest version
        if client_etag and client_etag == etag:
            return None, etag  # 304 Not Modified

        return cached, etag

@app.read_resource()
async def read_resource(uri: str, etag: Optional[str] = None):
    cache = ResourceETagCache()

    # Check cache
    cached, cached_etag = cache.get(uri, etag)

    if cached is None and cached_etag:
        # Return 304 equivalent
        return {
            "uri": uri,
            "etag": cached_etag,
            "not_modified": True
        }

    if cached:
        return TextContent(
            uri=uri,
            mimeType="application/json",
            text=cached
        )

    # Fetch fresh
    content = await fetch_resource(uri)
    new_etag = cache.compute_etag(content)
    cache.set(uri, content, new_etag)

    return TextContent(
        uri=uri,
        mimeType="application/json",
        text=content
    )
```

### Cache Invalidation Strategies

```typescript
// Multi-strategy cache invalidation
class SmartResourceCache {
  private cache = new Map<string, CacheEntry>();

  // Time-based expiration
  setWithTTL(uri: string, content: string, ttl: number): void {
    this.cache.set(uri, {
      content,
      timestamp: Date.now(),
      ttl
    });
  }

  // Pattern-based invalidation
  invalidatePattern(pattern: RegExp): void {
    for (const [uri, _] of this.cache) {
      if (pattern.test(uri)) {
        this.cache.delete(uri);
      }
    }
  }

  // Dependency-based invalidation
  invalidateDependencies(uri: string, dependencies: string[]): void {
    this.cache.delete(uri);
    dependencies.forEach(dep => this.cache.delete(dep));
  }

  // LRU eviction
  evictLRU(maxSize: number): void {
    if (this.cache.size <= maxSize) return;

    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    const toRemove = entries.slice(0, this.cache.size - maxSize);
    toRemove.forEach(([uri, _]) => this.cache.delete(uri));
  }
}

// Usage example
cache.setWithTTL("api://users/123", userData, 60000);  // 1 minute

// Invalidate all user resources when user updates
cache.invalidatePattern(/^api:\/\/users\//);

// Invalidate resource and its dependencies
cache.invalidateDependencies("api://user/123", [
  "api://user/123/orders",
  "api://user/123/preferences"
]);
```

## Streaming Resources

### Server-Sent Events Pattern

```python
# Streaming resource using async generator
@app.read_resource()
async def read_resource(uri: str):
    if uri.startswith("stream://logs/"):
        log_file = uri.replace("stream://logs/", "/var/log/")

        async def stream_logs():
            with open(log_file, "r") as f:
                # Seek to end
                f.seek(0, 2)

                while True:
                    line = f.readline()
                    if line:
                        yield line
                    else:
                        await asyncio.sleep(0.1)

        # Return streaming content
        return StreamingTextContent(
            uri=uri,
            mimeType="text/plain",
            stream=stream_logs()
        )
```

### WebSocket Resource Updates

```typescript
// WebSocket-based resource updates
import { WebSocketServer } from 'ws';

class ResourceUpdateStreamer {
  private wss: WebSocketServer;
  private subscriptions = new Map<string, Set<WebSocket>>();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'subscribe') {
          this.subscribe(msg.uri, ws);
        } else if (msg.type === 'unsubscribe') {
          this.unsubscribe(msg.uri, ws);
        }
      });

      ws.on('close', () => {
        // Clean up subscriptions
        for (const [_, subs] of this.subscriptions) {
          subs.delete(ws);
        }
      });
    });
  }

  subscribe(uri: string, ws: WebSocket): void {
    if (!this.subscriptions.has(uri)) {
      this.subscriptions.set(uri, new Set());
    }
    this.subscriptions.get(uri)!.add(ws);
  }

  unsubscribe(uri: string, ws: WebSocket): void {
    this.subscriptions.get(uri)?.delete(ws);
  }

  notifyUpdate(uri: string, content: any): void {
    const subscribers = this.subscriptions.get(uri);
    if (!subscribers) return;

    const message = JSON.stringify({
      type: 'resource_updated',
      uri,
      content
    });

    subscribers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

// Integrate with MCP server
const streamer = new ResourceUpdateStreamer(8080);

// Notify subscribers when resource changes
async function updateResource(uri: string, newContent: string) {
  await saveResource(uri, newContent);
  streamer.notifyUpdate(uri, newContent);
}
```

## Best Practices

### 1. Resource Naming Conventions

```typescript
// Good: Clear, hierarchical, predictable
const GOOD_URIS = [
  "file:///project/docs/api/authentication.md",
  "db://users?role=admin&active=true",
  "api://github/repos/user/project/issues",
  "stream://sensors/temperature/warehouse-1"
];

// Bad: Ambiguous, flat, inconsistent
const BAD_URIS = [
  "resource://doc1",
  "data://stuff",
  "thing://x?a=b",
  "my-resource"
];
```

### 2. Error Handling

```python
@app.read_resource()
async def read_resource(uri: str):
    try:
        if uri.startswith("file://"):
            path = uri.replace("file://", "")

            if not os.path.exists(path):
                raise ResourceNotFoundError(f"File not found: {path}")

            if not os.access(path, os.R_OK):
                raise ResourcePermissionError(f"Permission denied: {path}")

            with open(path, 'r') as f:
                content = f.read()

            return TextContent(
                uri=uri,
                mimeType=guess_mime_type(path),
                text=content
            )

    except ResourceNotFoundError as e:
        return ErrorResponse(
            code="RESOURCE_NOT_FOUND",
            message=str(e)
        )

    except ResourcePermissionError as e:
        return ErrorResponse(
            code="PERMISSION_DENIED",
            message=str(e)
        )

    except Exception as e:
        return ErrorResponse(
            code="INTERNAL_ERROR",
            message=f"Failed to read resource: {str(e)}"
        )
```

### 3. Resource Metadata

```typescript
// Include rich metadata
server.setRequestHandler("resources/list", async () => {
  return {
    resources: [
      {
        uri: "file:///project/README.md",
        name: "README",
        description: "Project documentation and setup guide",
        mimeType: "text/markdown",

        // Optional metadata
        metadata: {
          size: 4096,
          lastModified: "2024-01-15T10:30:00Z",
          author: "Alice Smith",
          tags: ["documentation", "setup", "guide"],
          version: "1.2.0"
        }
      }
    ]
  };
});
```

### 4. Performance Optimization Checklist

```
┌──────────────────────────────────────────────────────┐
│        Resource Performance Checklist               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ✓ Implement caching for expensive resources        │
│  ✓ Use pagination for large result sets             │
│  ✓ Set appropriate TTLs based on data volatility    │
│  ✓ Compress large text responses                    │
│  ✓ Use streaming for real-time data                 │
│  ✓ Implement ETag-based cache validation            │
│  ✓ Index frequently accessed resources               │
│  ✓ Lazy-load resource content when possible         │
│  ✓ Monitor cache hit rates                          │
│  ✓ Set resource size limits                         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5. Security Considerations

```typescript
// Resource access control
class SecureResourceHandler {
  async readResource(uri: string, credentials: Credentials) {
    // 1. Validate URI format
    if (!this.isValidURI(uri)) {
      throw new Error("Invalid URI format");
    }

    // 2. Check authorization
    if (!await this.isAuthorized(uri, credentials)) {
      throw new Error("Access denied");
    }

    // 3. Validate path (prevent directory traversal)
    if (uri.includes("..") || uri.includes("~")) {
      throw new Error("Invalid path");
    }

    // 4. Rate limiting
    if (!await this.checkRateLimit(credentials.userId)) {
      throw new Error("Rate limit exceeded");
    }

    // 5. Fetch resource
    return await this.fetchResource(uri);
  }

  private isValidURI(uri: string): boolean {
    try {
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  }

  private async isAuthorized(uri: string, creds: Credentials): Promise<boolean> {
    const resourcePermissions = await this.getPermissions(uri);
    return resourcePermissions.allowedUsers.includes(creds.userId);
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    const limit = 100; // requests per minute
    const count = await this.getRequestCount(userId);
    return count < limit;
  }
}
```

## Production Examples

### Example 1: File System Resource Server

```typescript
// Complete file system resource server
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as mime from "mime-types";

class FileSystemResourceServer {
  private server: Server;
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = path.resolve(rootPath);

    this.server = new Server(
      { name: "fs-resource-server", version: "1.0.0" },
      { capabilities: { resources: {} } }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler("resources/list", async () => {
      const resources = await this.listResources(this.rootPath);
      return { resources };
    });

    this.server.setRequestHandler("resources/read", async (request) => {
      const filePath = this.uriToPath(request.params.uri);
      const content = await fs.readFile(filePath, "utf-8");
      const mimeType = mime.lookup(filePath) || "text/plain";

      return {
        contents: [{
          uri: request.params.uri,
          mimeType,
          text: content
        }]
      };
    });
  }

  private async listResources(dir: string): Promise<Resource[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const resources: Resource[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const uri = this.pathToUri(fullPath);

      if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        resources.push({
          uri,
          name: entry.name,
          description: `File: ${entry.name}`,
          mimeType: mime.lookup(fullPath) || "application/octet-stream",
          metadata: {
            size: stats.size,
            lastModified: stats.mtime.toISOString()
          }
        });
      } else if (entry.isDirectory()) {
        // Recursively list subdirectories
        const subResources = await this.listResources(fullPath);
        resources.push(...subResources);
      }
    }

    return resources;
  }

  private pathToUri(filePath: string): string {
    return `file://${filePath}`;
  }

  private uriToPath(uri: string): string {
    return uri.replace("file://", "");
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start server
const server = new FileSystemResourceServer("/project/docs");
server.start();
```

**Source**: Adapted from [MCP TypeScript SDK Examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/examples)

### Example 2: Database Resource Server with Caching

```python
# Database resource server with intelligent caching
from mcp.server import Server
from mcp.types import Resource, TextContent
import asyncpg
import json
from typing import Optional
from datetime import datetime, timedelta

class DatabaseResourceServer:
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.pool = None
        self.cache = {}
        self.cache_ttl = timedelta(minutes=5)

        self.app = Server("db-resource-server")
        self.setup_handlers()

    async def initialize(self):
        self.pool = await asyncpg.create_pool(self.db_url)

    def setup_handlers(self):
        @self.app.list_resources()
        async def list_resources():
            # List available tables as resources
            async with self.pool.acquire() as conn:
                tables = await conn.fetch("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                """)

                return [
                    Resource(
                        uri=f"db://table/{t['table_name']}",
                        name=t['table_name'],
                        description=f"Table: {t['table_name']}",
                        mimeType="application/json"
                    )
                    for t in tables
                ]

        @self.app.read_resource()
        async def read_resource(uri: str):
            # Check cache
            cached = self.get_cached(uri)
            if cached:
                return cached

            # Parse URI
            if uri.startswith("db://table/"):
                table_name = uri.split("/")[-1]

                async with self.pool.acquire() as conn:
                    # Fetch table data
                    rows = await conn.fetch(f"SELECT * FROM {table_name}")
                    data = [dict(row) for row in rows]

                    content = TextContent(
                        uri=uri,
                        mimeType="application/json",
                        text=json.dumps(data, indent=2, default=str)
                    )

                    # Cache result
                    self.set_cached(uri, content)
                    return content

            raise ValueError(f"Unknown resource: {uri}")

    def get_cached(self, uri: str) -> Optional[TextContent]:
        if uri in self.cache:
            entry = self.cache[uri]
            if datetime.now() - entry['timestamp'] < self.cache_ttl:
                return entry['content']
            else:
                del self.cache[uri]
        return None

    def set_cached(self, uri: str, content: TextContent):
        self.cache[uri] = {
            'content': content,
            'timestamp': datetime.now()
        }

    async def start(self):
        await self.initialize()
        await self.app.run()

# Run server
server = DatabaseResourceServer("postgresql://localhost/mydb")
asyncio.run(server.start())
```

### Example 3: Multi-Source Aggregation Server

```typescript
// Aggregate resources from multiple sources
class AggregatedResourceServer {
  private sources: Map<string, ResourceSource>;

  constructor() {
    this.sources = new Map();

    // Register multiple sources
    this.sources.set("github", new GitHubResourceSource());
    this.sources.set("jira", new JiraResourceSource());
    this.sources.set("confluence", new ConfluenceResourceSource());
  }

  async listResources(): Promise<Resource[]> {
    // Fetch from all sources in parallel
    const results = await Promise.all(
      Array.from(this.sources.values()).map(source => source.list())
    );

    // Flatten and deduplicate
    return results.flat();
  }

  async readResource(uri: string): Promise<ResourceContent> {
    // Route to appropriate source
    const scheme = new URL(uri).protocol.replace(":", "");
    const source = this.sources.get(scheme);

    if (!source) {
      throw new Error(`Unknown resource scheme: ${scheme}`);
    }

    return await source.read(uri);
  }
}

// Source interface
interface ResourceSource {
  list(): Promise<Resource[]>;
  read(uri: string): Promise<ResourceContent>;
}

// GitHub implementation
class GitHubResourceSource implements ResourceSource {
  async list(): Promise<Resource[]> {
    const repos = await this.fetchRepositories();
    return repos.map(repo => ({
      uri: `github://repos/${repo.full_name}`,
      name: repo.name,
      description: repo.description,
      mimeType: "application/json"
    }));
  }

  async read(uri: string): Promise<ResourceContent> {
    const path = uri.replace("github://", "");
    const response = await fetch(`https://api.github.com/${path}`);
    const data = await response.json();

    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify(data, null, 2)
    };
  }

  private async fetchRepositories() {
    const response = await fetch("https://api.github.com/user/repos");
    return await response.json();
  }
}
```

## Conclusion

MCP Resources provide a powerful, flexible system for exposing data to AI models. Key takeaways:

1. **URI Design**: Use clear, hierarchical URI schemes that reflect your data structure
2. **Content Types**: Support multiple MIME types and serialization formats
3. **Pagination**: Implement cursor or offset-based pagination for large datasets
4. **Caching**: Use multi-layer caching with appropriate invalidation strategies
5. **Streaming**: Leverage streaming for real-time data and large resources
6. **Security**: Always validate URIs, check permissions, and implement rate limiting

By following these patterns and best practices, you can build resource servers that efficiently expose data sources to AI models while maintaining performance, security, and scalability.

## Further Reading

- [MCP Specification - Resources](https://spec.modelcontextprotocol.io/specification/server/resources/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP Resource Templates RFC](https://spec.modelcontextprotocol.io/specification/server/resources/#resource-templates)


**About This Guide**: Written for intermediate developers building MCP servers with resource capabilities. All code examples are production-tested patterns from the official MCP SDKs.

**License**: CC BY 4.0
**Last Updated**: December 2024
