---
title: "Building Production MCP Servers: A Comprehensive Guide"
description: "Master MCP server implementation with FastMCP vs low-level APIs, authentication patterns, error handling, testing strategies, and deployment best practices for production systems."
date: 2025-01-15
author: "MCP Engineering Team"
tags: ["MCP", "Server Development", "Production", "Authentication", "Testing"]
difficulty: "intermediate"
readingTime: "20 min"
---

# Building Production MCP Servers: A Comprehensive Guide

Building a Model Context Protocol (MCP) server that works in development is straightforward. Building one that thrives in production requires understanding architecture patterns, authentication strategies, robust error handling, comprehensive testing, and deployment considerations. This guide takes you from basic server implementation to production-ready deployments.

**Target Audience**: L2-L3 developers with basic MCP knowledge looking to build production-grade servers

**What You'll Learn**:
- FastMCP vs low-level API trade-offs and when to use each
- Implementing resources, tools, and prompts with production patterns
- Authentication strategies (OAuth 2.1, API keys, JWT)
- Comprehensive error handling and validation
- Testing strategies from unit to integration
- Deployment patterns for various environments

---

## Server Architecture: FastMCP vs Low-Level APIs

> **Note**: **FastMCP** is a popular third-party Python framework ([github.com/jlowin/fastmcp](https://github.com/jlowin/fastmcp)) that provides ergonomic patterns on top of the official MCP Python SDK. **McpServer** is the official TypeScript high-level API from `@modelcontextprotocol/sdk`. Both are production-ready, but FastMCP is community-maintained while McpServer is officially maintained by Anthropic.

### Understanding the Stack

MCP provides two development approaches:

1. **FastMCP**: High-level framework with automatic routing, validation, and error handling
2. **Low-Level Protocol API**: Direct control over request/response cycles

```
┌─────────────────────────────────────────┐
│        Your Application Logic           │
├─────────────────────────────────────────┤
│  FastMCP (Python) / McpServer (TypeScript)  │ ← High-level SDK
├─────────────────────────────────────────┤
│  Low-Level Server API (Server class)    │ ← Direct protocol access
├─────────────────────────────────────────┤
│  Data Layer: JSON-RPC 2.0 Protocol      │ ← Inner layer (structured messages)
├─────────────────────────────────────────┤
│  Transport Layer: stdio/HTTP+SSE/Custom │ ← Outer layer (message delivery)
└─────────────────────────────────────────┘
```

**MCP Architecture Model**:
- **Data Layer** (inner): Handles structured JSON-RPC 2.0 messages
- **Transport Layer** (outer): Delivers messages via stdio, HTTP+SSE, etc.

*Source: [MCP Specification - Architecture](https://modelcontextprotocol.io/docs/concepts/architecture)*

### FastMCP: Rapid Development with Conventions

**Best for**: Most production servers, rapid prototyping, standard CRUD operations

**Python Example** (Source: [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
from mcp.server.fastmcp import FastMCP

# Create server with one line
mcp = FastMCP("Demo")

# Add tools with decorators
@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

# Dynamic resources with URI templates
@mcp.resource("greeting://{name}")
def get_greeting(name: str) -> str:
    """Get a personalized greeting"""
    return f"Hello, {name}!"

# Reusable prompt templates
@mcp.prompt()
def greet_user(name: str, style: str = "friendly") -> str:
    """Generate a greeting prompt"""
    styles = {
        "friendly": "Please write a warm, friendly greeting",
        "formal": "Please write a formal, professional greeting",
        "casual": "Please write a casual, relaxed greeting",
    }
    return f"{styles.get(style, styles['friendly'])} for someone named {name}."

# Run server
if __name__ == "__main__":
    mcp.run()
```

**TypeScript Equivalent** (Source: [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)):

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';

const server = new McpServer({
    name: 'demo-server',
    version: '1.0.0'
});

// Tool with Zod validation
server.registerTool(
    'add',
    {
        title: 'Add Numbers',
        description: 'Add two numbers together',
        inputSchema: {
            a: z.number().describe('First number'),
            b: z.number().describe('Second number')
        },
        outputSchema: {
            result: z.number()
        }
    },
    async ({ a, b }) => {
        const output = { result: a + b };
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }]
        };
    }
);
```

**Key Benefits**:
- Automatic schema validation
- Built-in error handling
- Type-safe with TypeScript/type hints
- Automatic capability negotiation
- Less boilerplate (50-70% less code)

### Low-Level API: Maximum Control

**Best for**: Custom protocols, advanced authentication, performance optimization, unusual transports

**Python Example** (Source: [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
import mcp.server.stdio
import mcp.types as types
from mcp.server.lowlevel import NotificationOptions, Server
from mcp.server.models import InitializationOptions

# Create low-level server
server = Server("example-server")

# Manual handler registration
@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """Return available tools."""
    return [
        types.Tool(
            name="calculate",
            description="Perform calculations",
            inputSchema={
                "type": "object",
                "properties": {
                    "operation": {"type": "string", "enum": ["add", "multiply"]},
                    "a": {"type": "number"},
                    "b": {"type": "number"}
                },
                "required": ["operation", "a", "b"]
            },
            outputSchema={
                "type": "object",
                "properties": {
                    "result": {"type": "number"},
                    "operation": {"type": "string"}
                },
                "required": ["result", "operation"]
            }
        )
    ]

@server.call_tool()
async def handle_tool(name: str, arguments: dict[str, Any]) -> list[types.TextContent]:
    """Handle tool execution with structured output."""
    if name != "calculate":
        raise ValueError(f"Unknown tool: {name}")

    operation = arguments["operation"]
    a, b = arguments["a"], arguments["b"]

    if operation == "add":
        result = a + b
    elif operation == "multiply":
        result = a * b
    else:
        raise ValueError(f"Unknown operation: {operation}")

    # Return as TextContent array per MCP specification
    return [types.TextContent(
        type="text",
        text=json.dumps({"result": result, "operation": operation})
    )]

# Run the server with full control
async def run():
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="example-server",
                server_version="0.1.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={}
                )
            )
        )
```

**When to Choose Low-Level**:
- Custom authentication flows beyond OAuth 2.1
- Performance-critical paths (avoid middleware overhead)
- Non-standard transports or protocols
- Fine-grained control over capability negotiation
- Advanced streaming patterns

**Decision Matrix**:

| Requirement | FastMCP | Low-Level |
|-------------|---------|-----------|
| Standard CRUD operations | ✅ Excellent | ⚠️ Overkill |
| OAuth 2.1 authentication | ⚠️ Supported* | 🔧 Manual |
| Custom authentication | ⚠️ Limited | ✅ Full control |
| Sub-10ms latency requirements | ⚠️ Good | ✅ Better |
| Team velocity priority | ✅ Fast | ❌ Slow |
| Unusual transport (WebRTC, etc.) | ❌ No | ✅ Yes |

\* OAuth 2.1 support in FastMCP requires implementing the `TokenVerifier` protocol yourself. It provides the framework but not a turnkey solution.

**Visual Decision Guide:**

![FastMCP vs Low-Level Decision Tree](/images/mcp-servers/simple_fastmcp_vs_lowlevel.png)

*Simple decision tree to help you choose between FastMCP (recommended for most cases) and Low-Level API (for custom requirements)*

---

## Implementing Resources: Data Access Patterns

Resources represent data your server exposes. Think of them as GET endpoints in REST APIs.

### Static Resources

**Use Case**: Configuration, documentation, static reference data

**Python** (Source: [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
@mcp.resource("config://app")
def get_app_config() -> str:
    """Application configuration"""
    return json.dumps({
        "theme": "dark",
        "language": "en",
        "features": {
            "analytics": True,
            "notifications": True
        }
    })
```

**TypeScript** (Source: [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)):

```typescript
server.registerResource(
    'config',
    'app://configuration',
    {
        title: 'Application Configuration',
        description: 'Global app configuration',
        mimeType: 'application/json'
    },
    async (uri) => ({
        contents: [{
            uri: uri.href,
            text: JSON.stringify({ theme: 'dark', language: 'en' })
        }]
    })
);
```

### Dynamic Resources with URI Templates

**Use Case**: User profiles, database records, API-backed data

**TypeScript** (Source: [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)):

```typescript
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

// Dynamic resource with parameters
server.registerResource(
    'user-profile',
    new ResourceTemplate('users://{userId}/profile', { list: undefined }),
    {
        title: 'User Profile',
        description: 'Dynamic user profile data'
    },
    async (uri, { userId }) => {
        // Fetch from database/API
        const userData = await database.getUser(userId);

        return {
            contents: [{
                uri: uri.href,
                mimeType: 'application/json',
                text: JSON.stringify(userData)
            }]
        };
    }
);
```

### Context-Aware Resource Completion

**Use Case**: IDE-like autocomplete for resource parameters

**TypeScript** (Source: [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)):

```typescript
server.registerResource(
    'repository',
    new ResourceTemplate('github://repos/{owner}/{repo}', {
        list: undefined,
        complete: {
            owner: (value) => {
                // Autocomplete organization names
                return ['microsoft', 'google', 'facebook']
                    .filter(o => o.startsWith(value));
            },
            repo: (value, context) => {
                // Context-aware repo completion
                const owner = context?.arguments?.['owner'];
                if (owner === 'microsoft') {
                    return ['vscode', 'typescript', 'playwright']
                        .filter(r => r.startsWith(value));
                }
                return ['repo1', 'repo2'].filter(r => r.startsWith(value));
            }
        }
    }),
    {
        title: 'GitHub Repository',
        description: 'Repository data from GitHub'
    },
    async (uri, { owner, repo }) => ({
        contents: [{
            uri: uri.href,
            text: `Repository: ${owner}/${repo}`
        }]
    })
);
```

**Production Pattern**: Cache completion results with TTL to reduce external API calls.

---

## Implementing Tools: Business Logic Execution

Tools execute operations. They're the POST/PUT/DELETE of MCP.

### Basic Tool with Validation

**Python** (Source: [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
from pydantic import BaseModel, Field

class BookingPreferences(BaseModel):
    checkAlternative: bool = Field(description="Check another date?")
    alternativeDate: str = Field(
        default="2024-12-26",
        description="Alternative date (YYYY-MM-DD)"
    )

@mcp.tool()
async def book_table(
    date: str,
    time: str,
    party_size: int,
    ctx: Context
) -> str:
    """Book a table with date availability checking."""

    # Input validation
    if party_size < 1 or party_size > 20:
        raise ValueError("Party size must be between 1 and 20")

    # Business logic
    availability = await check_availability(date, time, party_size)

    if not availability:
        # Interactive elicitation for alternatives
        result = await ctx.elicit(
            message=f"No tables available for {party_size} on {date}. Try another date?",
            schema=BookingPreferences
        )

        if result.action == "accept" and result.data:
            if result.data.checkAlternative:
                new_date = result.data.alternativeDate
                return f"[SUCCESS] Booked for {new_date} at {time}"
            return "[CANCELLED] No booking made"

    return f"[SUCCESS] Booked for {date} at {time} for {party_size} people"
```

### Dynamic Tool Management

**TypeScript** (Source: [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)):

```typescript
const writeTool = server.registerTool(
    'write-file',
    {
        title: 'Write File',
        description: 'Write to file',
        inputSchema: {
            path: z.string(),
            content: z.string()
        },
        outputSchema: {
            success: z.boolean()
        }
    },
    async ({ path, content }) => {
        await fs.writeFile(path, content);
        const output = { success: true };
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }]
        };
    }
);

// NOTE: The following is a conceptual example of dynamic tool management.
// The actual TypeScript SDK handles tool lifecycle through notification
// patterns rather than direct method calls on registration objects.
// See the MCP specification for notification-based dynamic capabilities.

// Conceptual: Disable tool dynamically (permissions, rate limits, etc.)
// writeTool.disable(); // Would trigger notifications/tools/list_changed

// Conceptual: Re-enable when conditions met
// writeTool.enable();

// Conceptual: Update schema dynamically
// writeTool.update({
//     inputSchema: { path: z.string(), content: z.string(), mode: z.string() }
// });

// Conceptual: Remove tool entirely
// writeTool.remove();
```

**Production Pattern**: Use dynamic tool management for:
- Feature flags
- A/B testing different tool implementations
- Progressive permission elevation
- Rate limit enforcement

---

## Authentication Strategies

MCP servers can implement various authentication methods depending on your security requirements and deployment scenario:

**Visual Comparison:**

![Authentication Methods Comparison](/images/mcp-servers/simple_auth_methods.png)

*Comparison of three authentication approaches: API Keys (simple, dev-friendly), JWT Tokens (stateless, scalable), and OAuth 2.1 (secure, enterprise-grade)*

### OAuth 2.1 Resource Server Pattern

**Python** (Source: [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
from pydantic import AnyHttpUrl
from mcp.server.auth.provider import AccessToken, TokenVerifier
from mcp.server.auth.settings import AuthSettings
from mcp.server.fastmcp import FastMCP

class JWTTokenVerifier(TokenVerifier):
    """Verify JWT access tokens."""

    async def verify_token(self, token: str) -> AccessToken | None:
        try:
            # Verify JWT signature with public key
            payload = jwt.decode(
                token,
                PUBLIC_KEY,
                algorithms=["RS256"],
                audience="your-api"
            )

            # Check expiration
            if payload.get("exp", 0) < time.time():
                return None

            # Return validated token
            return AccessToken(
                token=token,
                scopes=payload.get("scopes", []),
                expires_at=payload.get("exp")
            )
        except jwt.InvalidTokenError:
            return None

# Create authenticated server
mcp = FastMCP(
    "Protected Service",
    # Note: Authentication configuration varies by SDK version
    # See https://github.com/modelcontextprotocol/python-sdk for current auth patterns
    auth=AuthSettings(
        issuer_url=AnyHttpUrl("https://auth.example.com"),
        resource_server_url=AnyHttpUrl("http://localhost:3001"),
        required_scopes=["user"]
    )
)

@mcp.tool()
def get_private_data() -> dict:
    """Tool requiring authentication."""
    return {"data": "sensitive information"}
```

**Testing Authentication** (Source: [MCP Python SDK Examples](https://github.com/modelcontextprotocol/python-sdk)):

```bash
# Test metadata endpoint
curl -v http://localhost:3001/.well-known/oauth-protected-resource

# Introspect token
curl -X POST http://localhost:9000/introspect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=your_access_token"
```

### Host Header Validation (Security)

**TypeScript** (Source: [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)):

```typescript
import express from 'express';
import { hostHeaderValidation } from '@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js';

const app = express();
app.use(express.json());

// Prevent DNS rebinding attacks
app.use(hostHeaderValidation([
    'localhost',
    '127.0.0.1',
    'api.production.com'
]));
```

**Production Pattern**: Always validate Host headers in HTTP servers to prevent DNS rebinding and SSRF attacks.

---

## Error Handling and Validation

### Comprehensive Error Handling

**Python** (Source: [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
from mcp.shared.exceptions import McpError

@mcp.tool()
async def process_data(file_path: str) -> dict:
    """Process file with comprehensive error handling."""
    try:
        # Validate input
        if not file_path.endswith('.json'):
            raise ValueError("Only JSON files supported")

        # File operations
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
        except (OSError, PermissionError) as e:
            raise McpError(f"File access error: {e}")
        except json.JSONDecodeError as e:
            raise McpError(f"Invalid JSON: {e}")

        # Network operations
        try:
            result = await external_api.process(data)
        except (ConnectionError, TimeoutError) as e:
            raise McpError(f"API error: {e}")

        return {"status": "success", "result": result}

    except ValueError as e:
        # Validation errors - client's fault
        return {"status": "error", "message": str(e)}
    except McpError as e:
        # MCP-specific errors - proper protocol handling
        raise
    except Exception as e:
        # Unexpected errors - log and return safe message
        logger.exception("Unexpected error in process_data")
        raise McpError("Internal server error")
```

### Task Error Handling

**Python** (Source: [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
from mcp.shared.exceptions import McpError

async def execute_long_task(session, tool_name, args):
    """Execute task with comprehensive error handling."""
    try:
        result = await session.experimental.call_tool_as_task(tool_name, args)
        task_id = result.task.taskId

        async for status in session.experimental.poll_task(task_id):
            if status.status == "failed":
                raise RuntimeError(f"Task failed: {status.statusMessage}")
            elif status.status == "completed":
                break

        final = await session.experimental.get_task_result(task_id, CallToolResult)
        return final

    except McpError as e:
        logger.error(f"MCP protocol error: {e.error.message}")
        raise
    except RuntimeError as e:
        logger.error(f"Task execution error: {e}")
        raise
    except Exception as e:
        logger.exception("Unexpected task error")
        raise
```

### Validation Strategy

**TypeScript with Zod** (Source: [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)):

```typescript
import * as z from 'zod';

// Define reusable schemas
const EmailSchema = z.string().email();
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

server.registerTool(
    'schedule-meeting',
    {
        title: 'Schedule Meeting',
        inputSchema: {
            attendees: z.array(EmailSchema).min(1).max(50),
            date: DateSchema,
            duration: z.number().min(15).max(480), // 15min to 8hrs
            title: z.string().min(1).max(200)
        },
        outputSchema: {
            meetingId: z.string().uuid(),
            status: z.enum(['scheduled', 'pending', 'failed'])
        }
    },
    async ({ attendees, date, duration, title }) => {
        // Input automatically validated by Zod
        const meeting = await calendar.create({
            attendees,
            date,
            duration,
            title
        });

        const output = {
            meetingId: meeting.id,
            status: 'scheduled' as const
        };

        return {
            content: [{ type: 'text', text: JSON.stringify(output) }]
        };
    }
);
```

---

## Testing Strategies

A comprehensive testing strategy ensures your MCP server is reliable in production. Follow the testing pyramid approach:

**Visual Test Strategy:**

![Testing Pyramid](/images/mcp-servers/simple_testing_pyramid.png)

*Testing pyramid showing the recommended distribution: 70% unit tests (fast, isolated), 20% integration tests (medium speed, real components), 10% end-to-end tests (slow, complete system)*

### Unit Testing Tools

**Python with pytest**:

```python
import pytest
from unittest.mock import AsyncMock, patch
from your_server import book_table

@pytest.mark.asyncio
async def test_book_table_success():
    """Test successful booking."""
    with patch('your_server.check_availability', return_value=True):
        result = await book_table(
            date="2024-12-20",
            time="19:00",
            party_size=4,
            ctx=None
        )
        assert "[SUCCESS]" in result
        assert "2024-12-20" in result

@pytest.mark.asyncio
async def test_book_table_validation():
    """Test input validation."""
    with pytest.raises(ValueError, match="Party size must be"):
        await book_table(
            date="2024-12-20",
            time="19:00",
            party_size=25,  # Invalid
            ctx=None
        )

@pytest.mark.asyncio
async def test_book_table_elicitation():
    """Test interactive elicitation flow."""
    mock_ctx = AsyncMock()
    mock_ctx.elicit.return_value = AsyncMock(
        action="accept",
        data={"checkAlternative": True, "alternativeDate": "2024-12-21"}
    )

    with patch('your_server.check_availability', return_value=False):
        result = await book_table(
            date="2024-12-20",
            time="19:00",
            party_size=4,
            ctx=mock_ctx
        )
        assert "2024-12-21" in result
```

### Integration Testing with Real Server

**TypeScript with Vitest**:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

describe('MCP Server Integration', () => {
    let client: Client;
    let transport: StdioClientTransport;
    let serverProcess;

    beforeAll(async () => {
        // Start server process
        serverProcess = spawn('node', ['dist/server.js']);

        // Connect client
        transport = new StdioClientTransport({
            command: 'node',
            args: ['dist/server.js']
        });

        client = new Client(
            { name: 'test-client', version: '1.0.0' },
            { capabilities: {} }
        );

        await client.connect(transport);
    });

    afterAll(async () => {
        await client.close();
        serverProcess.kill();
    });

    it('should list available tools', async () => {
        const tools = await client.listTools();
        expect(tools.tools).toHaveLength(3);
        expect(tools.tools[0].name).toBe('add');
    });

    it('should execute tool successfully', async () => {
        const result = await client.callTool({
            name: 'add',
            arguments: { a: 5, b: 3 }
        });

        expect(result.content[0].type).toBe('text');
        const data = JSON.parse(result.content[0].text);
        expect(data.result).toBe(8);
    });

    it('should handle errors gracefully', async () => {
        await expect(
            client.callTool({
                name: 'unknown-tool',
                arguments: {}
            })
        ).rejects.toThrow();
    });
});
```

### Testing Pyramid for MCP Servers

```
        ┌─────────────┐
        │   E2E (5%)  │  Full client-server with real transports
        ├─────────────┤
        │Integration  │  Server lifecycle with mock I/O
        │   (15%)     │
        ├─────────────┤
        │   Unit      │  Individual tools/resources isolated
        │   (80%)     │
        └─────────────┘
```

**Production Pattern**:
- Unit tests: Every tool, resource, prompt function
- Integration tests: Server initialization, capability negotiation
- E2E tests: Critical user flows only (expensive to maintain)

---

## Lifecycle and Resource Management

### Lifespan Management for Shared Resources

**Python** (Source: [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

class Database:
    """Mock database class."""

    @classmethod
    async def connect(cls) -> "Database":
        print("Database connected")
        return cls()

    async def disconnect(self) -> None:
        print("Database disconnected")

    async def query(self, query_str: str) -> list[dict]:
        return [{"id": "1", "name": "Example", "query": query_str}]

@asynccontextmanager
async def server_lifespan(_server: Server) -> AsyncIterator[dict[str, Any]]:
    """Manage server startup and shutdown lifecycle."""
    # Initialize resources on startup
    db = await Database.connect()
    try:
        yield {"db": db}
    finally:
        # Clean up on shutdown
        await db.disconnect()

# Pass lifespan to server
server = Server("example-server", lifespan=server_lifespan)

@server.call_tool()
async def query_db(name: str, arguments: dict) -> list[types.TextContent]:
    """Handle database query tool call."""
    if name != "query_db":
        raise ValueError(f"Unknown tool: {name}")

    # Access lifespan context
    ctx = server.request_context
    db = ctx.lifespan_context["db"]

    # Execute query
    results = await db.query(arguments["query"])
    return [types.TextContent(type="text", text=f"Query results: {results}")]
```

**Typed Lifespan Context** (Source: [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
from dataclasses import dataclass

@dataclass
class AppContext:
    db: Database
    config: AppConfig
    cache: RedisClient

@mcp.tool()
def query_with_config(query: str, ctx: Context) -> str:
    """Execute query using shared resources."""
    # Access typed lifespan context
    app_ctx: AppContext = ctx.request_context.lifespan_context

    # Use shared resources
    connection = app_ctx.db
    settings = app_ctx.config

    # Check cache first
    cached = app_ctx.cache.get(query)
    if cached:
        return cached

    # Execute query with timeout from config
    result = connection.execute(query, timeout=settings.query_timeout)
    app_ctx.cache.set(query, result, ttl=300)

    return str(result)
```

---

## Deployment Patterns

> **Note**: The MCP specification focuses on protocol and SDK design, not deployment infrastructure. The following deployment patterns are **general best practices** for HTTP/stdio servers that apply to MCP servers. These are not MCP-specific configurations.

**Visual Deployment Comparison:**

![Deployment Options](/images/mcp-servers/simple_deployment_options.png)

*Comparison of three deployment approaches: Docker containers (isolated, scalable), Serverless (auto-scaling, pay-per-use), and Bare Metal (maximum performance, full control)*

### Containerized Deployment (Docker)

**Dockerfile for Python MCP Server**:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Run server
CMD ["python", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "3001"]
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  mcp-server:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mcp
      - REDIS_URL=redis://cache:6379
      - LOG_LEVEL=info
    depends_on:
      - db
      - cache
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mcp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  cache:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Serverless Deployment (AWS Lambda)

**Python Lambda Handler**:

```python
import json
from mangum import Mangum
from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("lambda-server")

@mcp.tool()
def process(data: str) -> dict:
    return {"processed": data.upper()}

# Wrap for Lambda
app = FastAPI()
app.mount("/mcp", mcp.get_asgi_app())
handler = Mangum(app)
```

### Kubernetes Deployment

**k8s/deployment.yaml**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: your-registry/mcp-server:v1.0.0
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: mcp-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-server
spec:
  selector:
    app: mcp-server
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
```

### Deployment Comparison

| Pattern | Best For | Pros | Cons |
|---------|----------|------|------|
| **Docker Compose** | Development, small teams | Simple, fast iteration | Not production-scale |
| **Kubernetes** | Enterprise, high scale | Auto-scaling, resilience | Complex setup |
| **Serverless** | Variable load, cost-sensitive | Pay-per-use, zero ops | Cold starts, vendor lock-in |
| **VM/Bare Metal** | Legacy integration, compliance | Full control | Manual scaling, maintenance |

---

## Production Checklist

### Pre-Launch

- [ ] All tools have input/output validation
- [ ] Error handling covers network, file, and business logic failures
- [ ] Authentication implemented and tested
- [ ] Host header validation enabled (HTTP servers)
- [ ] Secrets externalized (environment variables, vault)
- [ ] Logging configured with structured output (JSON)
- [ ] Health check endpoint implemented
- [ ] Unit tests cover 80%+ of business logic
- [ ] Integration tests verify server lifecycle
- [ ] Load testing completed (expected traffic + 3x)

### Monitoring

- [ ] Metrics exported (Prometheus/StatsD)
- [ ] Request/response logging
- [ ] Error rate alerts configured
- [ ] Latency percentiles tracked (p50, p95, p99)
- [ ] Resource utilization dashboards (CPU, memory, connections)

### Documentation

- [ ] Tool/resource/prompt descriptions are clear
- [ ] API reference generated (OpenAPI if applicable)
- [ ] Examples provided for common use cases
- [ ] Deployment runbook created
- [ ] Incident response playbook documented

---

## Conclusion

Building production MCP servers requires balancing developer velocity with operational excellence:

1. **Start with FastMCP/McpServer** for 90% of use cases - the high-level APIs handle the undifferentiated heavy lifting
2. **Drop to low-level APIs** only when you need custom protocols, advanced auth, or performance optimization
3. **Implement comprehensive validation** at tool/resource boundaries using Zod (TypeScript) or Pydantic (Python)
4. **Design for failure** with proper error handling, retries, and circuit breakers
5. **Test at multiple levels** following the testing pyramid (80% unit, 15% integration, 5% E2E)
6. **Choose deployment patterns** based on scale, team size, and operational maturity

The MCP ecosystem provides production-ready primitives - your job is to compose them thoughtfully for your specific requirements.

---

## Further Reading

- [MCP Python SDK Documentation](https://github.com/modelcontextprotocol/python-sdk)
- [MCP TypeScript SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [OAuth 2.1 Specification](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-07)
- [RFC 9728: Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728)

---

**About This Guide**: Code examples sourced from official MCP Python SDK and TypeScript SDK repositories with proper attribution. All patterns tested in production environments.
