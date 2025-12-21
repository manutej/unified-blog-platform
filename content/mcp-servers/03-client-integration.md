---
title: "MCP Client Integration: Building AI Applications That Connect"
subtitle: "A comprehensive guide"
difficulty: "Intermediate"
readingTime: 30
handsOnTime: 0
learningObjectives: []
prerequisites: []
tags:
  - "llm"
  - "ai"
  - "integration"
publishedDate: "2025-12-08"
---

# MCP Client Integration: Building AI Applications That Connect

**Part 3 of the MCP Deep Dive Series**

*Target Audience: L2-L3 Developers | Reading Time: 25 minutes*


## Table of Contents

1. [Introduction: The Client Perspective](#introduction)
2. [MCP Client Architecture](#client-architecture)
3. [Session Lifecycle Management](#session-lifecycle)
4. [Connection Handling and Transports](#connection-handling)
5. [Tool Calling Patterns](#tool-calling)
6. [Resource Access Strategies](#resource-access)
7. [Sampling Integration for LLM Capabilities](#sampling-integration)
8. [Error Recovery and Resilience](#error-recovery)
9. [Async Patterns and Concurrency](#async-patterns)
10. [Production Client Implementation](#production-implementation)
11. [Real-World Examples](#real-world-examples)
12. [Best Practices and Patterns](#best-practices)
13. [What's Next](#whats-next)


## Introduction: The Client Perspective {#introduction}

In the previous posts, we explored MCP foundations and server implementation. Now we shift perspective: **How do you build AI applications that connect to MCP servers?**

As a client developer, you're building the orchestration layer—the application that:

- **Discovers** what servers can do (tools, resources, prompts)
- **Executes** tool calls on behalf of users or LLMs
- **Retrieves** contextual data from resources
- **Manages** connections, sessions, and state
- **Handles** errors and edge cases gracefully
- **Integrates** LLM capabilities through sampling

This post teaches you how to build robust, production-ready MCP clients in TypeScript and Python.

### What You'll Learn

By the end of this post, you'll understand:

✅ **Session management**: Lifecycle, initialization, and cleanup
✅ **Connection patterns**: Transport selection and error handling
✅ **Tool orchestration**: Calling tools, handling results, structured output
✅ **Resource access**: Reading data, templates, and completion
✅ **Sampling integration**: Enabling server-driven LLM interactions
✅ **Error recovery**: Retries, timeouts, graceful degradation
✅ **Async patterns**: Concurrent operations, task management
✅ **Production patterns**: Logging, monitoring, security

Let's dive in.


## MCP Client Architecture {#client-architecture}

An MCP client is more than just a network connector—it's the orchestration hub for your AI application.

### Core Responsibilities

```
┌────────────────────────────────────────────────────┐
│              MCP CLIENT APPLICATION                 │
├────────────────────────────────────────────────────┤
│  Session Manager     │  Manages lifecycle, state   │
│  Transport Layer     │  HTTP, STDIO communication  │
│  Request Handler     │  Tool calls, resource reads │
│  Response Parser     │  Structured output parsing  │
│  Error Handler       │  Retries, fallbacks         │
│  Sampling Bridge     │  LLM integration layer      │
│  State Manager       │  Connection state tracking  │
└────────────────────────────────────────────────────┘
```

### The Client Stack

MCP clients operate across these layers:

**Per MCP Specification**:
1. **Data Layer**: JSON-RPC 2.0 protocol, lifecycle management, core primitives
2. **Transport Layer**: Communication mechanisms (STDIO, Streamable HTTP)

**For application development, we'll also consider**:
3. **Application Layer**: Your business logic, UI, multi-server orchestration

*Note: The Application Layer is not part of the MCP specification but represents
your client implementation sitting on top of the protocol.*

*Source: [MCP Specification - Architecture](https://modelcontextprotocol.io/docs/concepts/architecture)*

### TypeScript Client Architecture

Here's how the official TypeScript SDK structures clients:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Initialize client with configuration
const client = new Client({
    name: 'my-ai-app',
    version: '1.0.0'
});

// Transport determines communication mechanism
const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:3000/mcp')
);

// Connect establishes the session
await client.connect(transport);
```

*Source: [MCP TypeScript SDK - Client Initialization](https://github.com/modelcontextprotocol/typescript-sdk)*

### Python Client Architecture

Python clients use the `ClientSession` context manager for lifecycle management:

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Server parameters define how to connect
server_params = StdioServerParameters(
    command="python",
    args=["path/to/mcp_server.py"]
)

# Context manager handles session lifecycle
async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        # Initialize the connection
        await session.initialize()

        # Client is ready for operations
        tools = await session.list_tools()
```

*Source: [MCP Python SDK - Client Session](https://github.com/modelcontextprotocol/python-sdk)*

### Key Design Principles

1. **Stateful Sessions**: Maintain connection state across requests
2. **Capability Negotiation**: Discover what servers support dynamically
3. **Transport Abstraction**: Switch transports without code changes
4. **Type Safety**: Leverage schemas for validation (TypeScript Zod, Python types)
5. **Error Resilience**: Handle network failures, timeouts, invalid responses


## Session Lifecycle Management {#session-lifecycle}

Sessions are the heart of MCP client operations. Understanding the lifecycle is critical for building reliable applications.

### The Session Lifecycle

MCP defines three protocol lifecycle phases per the official specification:

**1. Initialization Phase**
```
Client                                  Server
   │                                       │
   │  initialize (version, capabilities)   │
   ├──────────────────────────────────────►│
   │                                       │
   │  InitializeResult (server caps)       │
   │◄──────────────────────────────────────┤
   │                                       │
   │  initialized notification             │
   ├──────────────────────────────────────►│
```

**2. Operation Phase**
- Tools, resources, prompts
- Server-initiated: sampling, logging

**3. Shutdown Phase**
- Transport layer closes connection
- No explicit protocol shutdown

**SDK Implementation Note**: Client SDKs may expose additional connection
states (connecting, connected, closing) for application convenience. These
are implementation details, not part of the protocol specification.

*Source: [MCP Specification - Lifecycle](https://modelcontextprotocol.io/specification/basic/lifecycle)*

### TypeScript: Session Initialization with HTTP

Streamable HTTP is the recommended transport for production clients:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const client = new Client({
    name: 'my-client',
    version: '1.0.0'
});

// Connect to server
const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:3000/mcp')
);
await client.connect(transport);

// List available tools
const toolsList = await client.listTools();
console.log('Available tools:', toolsList.tools.map(t => t.name));

// Call a tool
const result = await client.callTool({
    name: 'add',
    arguments: { a: 5, b: 3 }
});
console.log('Tool result:', result.content[0].text);

// Cleanup
await client.close();
```

*Source: [MCP TypeScript SDK - HTTP Client Example](https://context7.com/modelcontextprotocol/typescript-sdk)*

### TypeScript: Session with STDIO Transport

For local server processes, STDIO provides lightweight communication:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({
    name: 'stdio-client',
    version: '1.0.0'
});

// Spawn server process and connect via stdio
const transport = new StdioClientTransport({
    command: 'node',
    args: ['server.js']
});

await client.connect(transport);

const result = await client.callTool({
    name: 'get-time',
    arguments: {}
});

// Access content with type checking
if (result.content.length > 0 && result.content[0].type === 'text') {
    console.log('Server time:', result.content[0].text);
}

await client.close();
```

*Source: [MCP TypeScript SDK - STDIO Transport](https://context7.com/modelcontextprotocol/typescript-sdk)*

### Python: Context Manager Pattern

Python's async context managers provide elegant lifecycle management:

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run():
    """Run the client with proper lifecycle management."""
    server_params = StdioServerParameters(
        command="python",
        args=["path/to/mcp_server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize the connection
            await session.initialize()

            # List available tools
            tools = await session.list_tools()
            print("Available tools:")
            for tool in tools.tools:
                print(f"  - {tool.name}")

            # Session automatically closes on exit
```

*Source: [MCP Python SDK - Session Management](https://github.com/modelcontextprotocol/python-sdk)*

### Session State Management

Tracking session state helps debug and monitor client behavior:

**Visual Session State Machine:**

![Session States](/images/mcp-servers/simple_session_states.png)

*The five states of an MCP client session and their transitions*

```typescript
enum SessionState {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    CLOSING = 'closing',
    ERROR = 'error'
}

class ManagedClient {
    private state: SessionState = SessionState.DISCONNECTED;
    private client: Client;

    async connect(transport: Transport) {
        this.state = SessionState.CONNECTING;
        try {
            await this.client.connect(transport);
            this.state = SessionState.CONNECTED;
        } catch (error) {
            this.state = SessionState.ERROR;
            throw error;
        }
    }

    async close() {
        this.state = SessionState.CLOSING;
        await this.client.close();
        this.state = SessionState.DISCONNECTED;
    }

    isReady(): boolean {
        return this.state === SessionState.CONNECTED;
    }
}
```

### Session Persistence with External Storage

For horizontal scalability, persist session state externally:

```typescript
// Configure external database for session state
sessionIdGenerator: () => randomUUID(),
eventStore: databaseEventStore
```

*Source: [MCP TypeScript SDK - External State Storage](https://github.com/modelcontextprotocol/typescript-sdk)*

This pattern enables:
- **Horizontal scaling**: Any server node can handle any client
- **Fault tolerance**: Sessions survive server restarts
- **Audit trails**: Full request/response history

**Tradeoff**: Higher latency due to database access on each request.


## Connection Handling and Transports {#connection-handling}

Transport selection and connection management are critical for reliability and performance.

### Transport Comparison

**Visual Transport Comparison:**

![Transport Options](/images/mcp-servers/simple_transport_options.png)

*Choose STDIO for local development and CLI tools; use Streamable HTTP for production network deployments*

| Transport | Status | Best For | Key Characteristics |
|-----------|--------|----------|---------------------|
| **STDIO** | ✅ Current | Local processes | Lightweight, subprocess-based |
| **Streamable HTTP** | ✅ Current | Network servers | Modern, bidirectional, optional SSE |
| **HTTP+SSE** | ⚠️ **Deprecated (2024-11-05)** | Legacy only | Replaced by Streamable HTTP |

**Important**: HTTP+SSE was deprecated in protocol version 2024-11-05. Use Streamable HTTP for all new implementations.

*Source: [MCP Specification - Legacy Transports](https://modelcontextprotocol.io/specification/legacy/transports)*

### Streamable HTTP: Production Pattern

The recommended transport for modern deployments:

```typescript
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:3000/mcp')
);

await client.connect(transport);
```

**Why Streamable HTTP?**

- ✅ Bidirectional communication over HTTP
- ✅ Efficient streaming for large responses
- ✅ Works with serverless and edge deployments
- ✅ Better performance than SSE fallback

### Connection Retry Logic

Production clients need robust retry mechanisms:

```typescript
async function connectWithRetry(
    client: Client,
    transport: Transport,
    maxRetries = 3,
    delay = 1000
): Promise<void> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await client.connect(transport);
            console.log(`Connected on attempt ${attempt}`);
            return;
        } catch (error) {
            lastError = error;
            console.warn(`Connection attempt ${attempt} failed:`, error);

            if (attempt < maxRetries) {
                // Exponential backoff with jitter to prevent thundering herd
                const baseDelay = delay * Math.pow(2, attempt - 1);
                const jitter = Math.random() * 1000; // Add 0-1000ms random jitter
                const waitTime = baseDelay + jitter;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    throw new Error(`Failed to connect after ${maxRetries} attempts: ${lastError}`);
}
```

### Health Check Pattern

Monitor connection health proactively:

```typescript
class HealthyClient {
    private client: Client;
    private healthCheckInterval: NodeJS.Timer;

    async startHealthCheck(intervalMs = 30000) {
        this.healthCheckInterval = setInterval(async () => {
            try {
                // Lightweight ping operation
                await this.client.listTools();
            } catch (error) {
                console.error('Health check failed:', error);
                await this.reconnect();
            }
        }, intervalMs);
    }

    async reconnect() {
        console.log('Reconnecting...');
        await this.client.close();
        await connectWithRetry(this.client, this.transport);
        console.log('Reconnected successfully');
    }

    cleanup() {
        clearInterval(this.healthCheckInterval);
    }
}
```

### Multiple Server Connections

Connect to multiple servers simultaneously:

```typescript
class MultiServerClient {
    private clients: Map<string, Client> = new Map();

    async connectToServer(name: string, url: string) {
        const client = new Client({ name: `client-${name}`, version: '1.0.0' });
        const transport = new StreamableHTTPClientTransport(new URL(url));
        await client.connect(transport);
        this.clients.set(name, client);
    }

    async callToolOnServer(serverName: string, toolName: string, args: any) {
        const client = this.clients.get(serverName);
        if (!client) {
            throw new Error(`No connection to server: ${serverName}`);
        }
        return await client.callTool({ name: toolName, arguments: args });
    }

    async closeAll() {
        for (const [name, client] of this.clients) {
            await client.close();
        }
        this.clients.clear();
    }
}
```


## Tool Calling Patterns {#tool-calling}

Tool calling is the primary way clients execute actions on servers.

### Basic Tool Call (TypeScript)

```typescript
const result = await client.callTool({
    name: 'add',
    arguments: { a: 5, b: 3 }
});

// Access result content with type checking
if (result.content.length > 0 && result.content[0].type === 'text') {
    console.log('Tool result:', result.content[0].text);
}
```

*Source: [MCP TypeScript SDK - Tool Calling](https://context7.com/modelcontextprotocol/typescript-sdk)*

### Handling Structured Output

Modern MCP servers return structured data:

```python
from mcp.types import CallToolResult

result = await session.call_tool("get_user", {"id": "123"})

# Parse content with type checking
if result.content and len(result.content) > 0:
    first_content = result.content[0]
    if hasattr(first_content, 'text'):
        import json
        user_data = json.loads(first_content.text)
        print(f"User: {user_data.get('name')}, Age: {user_data.get('age')}")
```

*Source: [MCP Python SDK - Structured Output](https://github.com/modelcontextprotocol/python-sdk)*

### Parsing Different Content Types

Tools can return various content types:

```python
import asyncio
from mcp import ClientSession, StdioServerParameters, types
from mcp.client.stdio import stdio_client

async def parse_tool_results():
    """Demonstrates how to parse different types of content in CallToolResult."""
    server_params = StdioServerParameters(
        command="python", args=["path/to/mcp_server.py"]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # Example 1: Parsing text content
            result = await session.call_tool("get_data", {"format": "text"})
            for content in result.content:
                if isinstance(content, types.TextContent):
                    print(f"Text: {content.text}")

            # Example 2: Parsing JSON content from tools
            result = await session.call_tool("get_user", {"id": "123"})
            for content in result.content:
                if isinstance(content, types.TextContent):
                    import json
                    user_data = json.loads(content.text)
                    print(f"User: {user_data.get('name')}, Age: {user_data.get('age')}")

            # Example 3: Parsing embedded resources
            result = await session.call_tool("read_config", {})
            for content in result.content:
                if isinstance(content, types.EmbeddedResource):
                    resource = content.resource
                    if isinstance(resource, types.TextResourceContents):
                        print(f"Config from {resource.uri}: {resource.text}")
                    elif isinstance(resource, types.BlobResourceContents):
                        print(f"Binary data from {resource.uri}")

            # Example 4: Parsing image content
            result = await session.call_tool("generate_chart", {"data": [1, 2, 3]})
            for content in result.content:
                if isinstance(content, types.ImageContent):
                    print(f"Image ({content.mimeType}): {len(content.data)} bytes")

            # Example 5: Handling errors
            result = await session.call_tool("failing_tool", {})
            if result.isError:
                print("Tool execution failed!")
                for content in result.content:
                    if isinstance(content, types.TextContent):
                        print(f"Error: {content.text}")
```

*Source: [MCP Python SDK - Content Parsing](https://github.com/modelcontextprotocol/python-sdk)*

### Task-Augmented Tool Execution

For long-running operations, use task-based tool calling:

```python
from mcp.client.session import ClientSession
from mcp.types import CallToolResult

async with ClientSession(read, write) as session:
    await session.initialize()

    # Call tool as task
    result = await session.experimental.call_tool_as_task(
        "process_data",
        {"input": "hello"},
        ttl=60000,
    )
    task_id = result.task.taskId

    # Poll until complete
    async for status in session.experimental.poll_task(task_id):
        print(f"Status: {status.status} - {status.statusMessage or ''}")

    # Get result
    final = await session.experimental.get_task_result(task_id, CallToolResult)
    print(f"Result: {final.content[0].text}")
```

*Source: [MCP Python SDK - Task Tools](https://github.com/modelcontextprotocol/python-sdk)*

### Error Handling in Tool Calls

```python
from mcp.shared.exceptions import McpError

try:
    result = await session.experimental.call_tool_as_task("my_tool", args)
    task_id = result.task.taskId

    async for status in session.experimental.poll_task(task_id):
        if status.status == "failed":
            raise RuntimeError(f"Task failed: {status.statusMessage}")

    final = await session.experimental.get_task_result(task_id, CallToolResult)

except McpError as e:
    print(f"MCP error: {e.error.message}")
except Exception as e:
    print(f"Error: {e}")
```

*Source: [MCP Python SDK - Error Handling](https://github.com/modelcontextprotocol/python-sdk)*


## Resource Access Strategies {#resource-access}

Resources provide contextual data to your AI application.

### Listing Available Resources

Discover what data sources the server exposes:

```python
async def run():
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # List available resource templates
            templates = await session.list_resource_templates()
            print("Available resource templates:")
            for template in templates.resourceTemplates:
                print(f"  - {template.uriTemplate}")

            # List available prompts
            prompts = await session.list_prompts()
            print("\nAvailable prompts:")
            for prompt in prompts.prompts:
                print(f"  - {prompt.name}")
```

*Source: [MCP Python SDK - Resource Discovery](https://github.com/modelcontextprotocol/python-sdk)*

### Reading Resource Data (TypeScript)

```typescript
// List and read resources
const resources = await client.listResources();
console.log('Available resources:', resources.resources.map(r => r.uri));

const resourceData = await client.readResource({
    uri: 'app://configuration'
});
console.log('Resource content:', resourceData.contents[0].text);
```

*Source: [MCP TypeScript SDK - Resource Access](https://context7.com/modelcontextprotocol/typescript-sdk)*

### Dynamic Resource Templates

Resources with parameters enable flexible data access:

```typescript
// Server exposes: users://{userId}/profile
const userProfile = await client.readResource({
    uri: 'users://123/profile'
});

// Server exposes: github://repos/{owner}/{repo}
const repoData = await client.readResource({
    uri: 'github://repos/microsoft/vscode'
});
```

### Resource Completion

Get suggestions for dynamic resource parameters:

```typescript
// Request argument completion
const completions = await client.complete({
    ref: { type: 'ref/prompt', name: 'team-greeting' },
    argument: { name: 'department', value: 'eng' },
    context: { arguments: {} }
});
console.log('Suggestions:', completions.completion.values);
```

*Source: [MCP TypeScript SDK - Completion](https://context7.com/modelcontextprotocol/typescript-sdk)*


## Sampling Integration for LLM Capabilities {#sampling-integration}

Sampling allows servers to request LLM completions from the client, enabling sophisticated agentic workflows.

### Understanding Sampling

**Sampling** is when an MCP server asks the client to invoke an LLM:

```
┌─────────────┐                           ┌─────────────┐
│   Client    │                           │   Server    │
└──────┬──────┘                           └──────┬──────┘
       │                                         │
       │  1. callTool("analyze")                 │
       ├────────────────────────────────────────►│
       │                                         │
       │  2. sampling request: "What is X?"      │
       │◄────────────────────────────────────────┤
       │                                         │
       │  (Client calls LLM internally)          │
       │                                         │
       │  3. sampling response: "X is..."        │
       ├────────────────────────────────────────►│
       │                                         │
       │  4. Tool result (using LLM answer)      │
       │◄────────────────────────────────────────┤
```

### Client-Side Sampling Handler (TypeScript)

Register a handler to process sampling requests:

```typescript
import { CreateMessageRequestSchema } from '@modelcontextprotocol/sdk/types.js';

client.setRequestHandler(CreateMessageRequestSchema, async (request, extra) => {
    // Handle sampling request from server
    // In production, this would call your actual LLM

    const prompt = request.params.messages[0].content.text;

    // Call your LLM (example with mock response)
    const llmResponse = await yourLLM.complete(prompt, {
        maxTokens: request.params.maxTokens
    });

    return {
        role: "assistant",
        content: {
            type: "text",
            text: llmResponse
        },
        model: "your-model-name"
    };
});
```

*Source: [MCP TypeScript SDK - Sampling Handler](https://github.com/modelcontextprotocol/typescript-sdk)*

### Python Sampling Callback

```python
from mcp.types import CreateMessageRequestParams, CreateMessageResult, TextContent

async def handle_sampling(context, params: CreateMessageRequestParams) -> CreateMessageResult:
    """Handle sampling requests from the server."""
    # Extract the prompt from the request
    prompt = params.messages[-1].content.text if params.messages else ""

    # In production, call your actual LLM here
    # Example: response = await openai.chat.completions.create(...)

    # Return a mock response for demonstration
    return CreateMessageResult(
        role="assistant",
        content=TextContent(type="text", text=f"Response to: {prompt}"),
        model="my-model",
    )

# Use the callback when creating the session
async with ClientSession(
    read,
    write,
    sampling_callback=handle_sampling,
) as session:
    # Session can now handle sampling requests
    await session.initialize()
```

*Source: [MCP Python SDK - Sampling Callback](https://github.com/modelcontextprotocol/python-sdk)*

### Real-World Sampling Pattern

Integrate with actual LLM providers:

```python
from mcp.server.fastmcp import Context, FastMCP
from mcp.server.session import ServerSession
from mcp.types import SamplingMessage, TextContent

mcp = FastMCP(name="Sampling Example")

@mcp.tool()
async def generate_poem(topic: str, ctx: Context[ServerSession, None]) -> str:
    """Generate a poem using LLM sampling."""
    prompt = f"Write a short poem about {topic}"

    result = await ctx.session.create_message(
        messages=[
            SamplingMessage(
                role="user",
                content=TextContent(type="text", text=prompt),
            )
        ],
        max_tokens=100,
    )

    # Extract generated text
    if result.content.type == "text":
        return result.content.text
    return str(result.content)
```

*Source: [MCP Python SDK - LLM Sampling](https://github.com/modelcontextprotocol/python-sdk)*

### Advanced Sampling Configuration

Control LLM behavior with advanced parameters:

```python
result = await task.create_message(
    messages=[...],
    max_tokens=500,
    system_prompt="You are a helpful assistant",
    temperature=0.7,
    stop_sequences=["\n\n"],
    model_preferences=ModelPreferences(hints=[ModelHint(name="claude-3")]),
)
```

*Source: [MCP Python SDK - Sampling Configuration](https://github.com/modelcontextprotocol/python-sdk)*


## Error Recovery and Resilience {#error-recovery}

Production clients must handle failures gracefully.

### Error Categories

**Visual Error Handling Decision Tree:**

![Error Handling](/images/mcp-servers/simple_error_handling.png)

*Decision flow for handling different error types with appropriate recovery strategies*

| Error Type | Cause | Recovery Strategy |
|------------|-------|-------------------|
| **Network** | Connection lost, timeout | Retry with backoff |
| **JSON-RPC Protocol** | Protocol-level errors (-32700 to -32603) | Log error code, fail fast |
| **Application Protocol** | Invalid message format | Log and fail fast |
| **Server** | Tool execution failed | Return error to user |
| **Validation** | Invalid parameters | Fix and retry |
| **Authorization** | Permission denied | Request auth, fail gracefully |

### JSON-RPC Error Codes Reference

MCP uses JSON-RPC 2.0 for protocol communication. Understanding standard error codes is essential for robust error handling:

| Code | Name | Meaning | Retryable? |
|------|------|---------|------------|
| `-32700` | Parse Error | Invalid JSON received | ❌ No - Fix request format |
| `-32600` | Invalid Request | JSON is not valid Request object | ❌ No - Fix request structure |
| `-32601` | Method Not Found | Method does not exist | ❌ No - Check available methods |
| `-32602` | Invalid Params | Invalid method parameters | ❌ No - Fix parameter format |
| `-32603` | Internal Error | Internal JSON-RPC error | ⚠️ Maybe - Server-side issue, may be transient |
| `-32000` to `-32099` | Server Error | Application-defined errors | ⚠️ Depends - Check error message |

**Application-Defined Errors** (MCP-specific, range -32000 to -32099):
- `-32000`: General server error
- `-32001`: Capability not supported
- `-32002`: Resource not found
- `-32003`: Tool execution failed

*Source: [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification) and [MCP Protocol](https://modelcontextprotocol.io/specification)*

### Error Response Format

JSON-RPC error responses follow this structure:

```json
{
    "jsonrpc": "2.0",
    "id": 1,
    "error": {
        "code": -32601,
        "message": "Method not found",
        "data": {
            "method": "unknown_tool",
            "available_methods": ["tools/list", "resources/list", "prompts/list"]
        }
    }
}
```

The `error.data` field provides additional context about the error, which can include:
- Details about what went wrong
- Suggestions for fixing the issue
- List of valid alternatives
- Stack traces (in development environments)

### Comprehensive Error Handling Pattern

```typescript
class ResilientClient {
    async callToolWithRetry(
        toolName: string,
        args: any,
        maxRetries = 3
    ): Promise<CallToolResult> {
        let lastError: Error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.client.callTool({
                    name: toolName,
                    arguments: args
                });
            } catch (error) {
                lastError = error;

                // Check if error is retryable
                if (this.isNetworkError(error)) {
                    console.warn(`Network error, attempt ${attempt}/${maxRetries}`);
                    await this.exponentialBackoff(attempt);
                    continue;
                }

                // Non-retryable error
                throw error;
            }
        }

        throw new Error(`Failed after ${maxRetries} attempts: ${lastError}`);
    }

    private isNetworkError(error: any): boolean {
        // JSON-RPC errors that are NOT retryable
        const nonRetryableRpcCodes = [-32700, -32600, -32601, -32602];
        if (error.code && nonRetryableRpcCodes.includes(error.code)) {
            return false;
        }

        // Network errors that ARE retryable
        return error.code === 'ECONNREFUSED' ||
               error.code === 'ETIMEDOUT' ||
               error.code === -32603 ||  // Internal error might be transient
               error.message?.includes('network');
    }

    private async exponentialBackoff(attempt: number): Promise<void> {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}
```

### Circuit Breaker Pattern

**Visual Circuit Breaker States:**

![Circuit Breaker](/images/mcp-servers/simple_circuit_breaker.png)

*Three states of the circuit breaker pattern: Closed (normal), Open (blocking), Half-Open (testing)*

Prevent cascading failures:

```typescript
class CircuitBreaker {
    private failureCount = 0;
    private lastFailureTime: number = 0;
    private state: 'closed' | 'open' | 'half-open' = 'closed';

    constructor(
        private threshold = 5,
        private timeout = 60000  // 1 minute
    ) {}

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'half-open';
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        this.failureCount = 0;
        this.state = 'closed';
    }

    private onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.threshold) {
            this.state = 'open';
            console.error('Circuit breaker opened due to repeated failures');
        }
    }
}
```

### Timeout Management

Prevent indefinite hangs:

```typescript
async function callWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
}

// Usage
try {
    const result = await callWithTimeout(
        client.callTool({ name: 'slow-operation', arguments: {} }),
        5000  // 5 second timeout
    );
} catch (error) {
    console.error('Tool call timed out or failed:', error);
}
```


## Async Patterns and Concurrency {#async-patterns}

Modern clients need to handle concurrent operations efficiently.

### Parallel Tool Calls

Execute multiple tool calls simultaneously:

```typescript
async function parallelToolCalls(client: Client) {
    // Execute multiple tools in parallel
    const [weatherResult, newsResult, stockResult] = await Promise.all([
        client.callTool({ name: 'get-weather', arguments: { city: 'SF' } }),
        client.callTool({ name: 'get-news', arguments: { topic: 'tech' } }),
        client.callTool({ name: 'get-stock', arguments: { symbol: 'AAPL' } })
    ]);

    return {
        weather: weatherResult.content[0].text,
        news: newsResult.content[0].text,
        stock: stockResult.content[0].text
    };
}
```

### Sequential Dependent Calls

When operations depend on previous results:

```typescript
async function sequentialWorkflow(client: Client) {
    // Step 1: Get user data
    const userData = await client.callTool({
        name: 'get-user',
        arguments: { id: '123' }
    });

    // Parse user ID from content
    const userDataContent = userData.content[0].type === 'text'
        ? JSON.parse(userData.content[0].text)
        : null;
    const userId = userDataContent?.id;

    // Step 2: Use user ID to fetch orders (depends on step 1)
    const orders = await client.callTool({
        name: 'get-orders',
        arguments: { userId }
    });

    // Step 3: Process orders (depends on step 2)
    const ordersData = orders.content[0].type === 'text'
        ? JSON.parse(orders.content[0].text)
        : null;

    const processed = await client.callTool({
        name: 'process-orders',
        arguments: { orders: ordersData }
    });

    return processed;
}
```

### Concurrent Resource Reading

Read multiple resources in parallel:

```python
import asyncio

async def fetch_multiple_resources(session: ClientSession):
    """Fetch multiple resources concurrently."""

    # Define resource URIs
    uris = [
        'config://app/settings',
        'users://123/profile',
        'github://repos/owner/repo'
    ]

    # Fetch all in parallel
    results = await asyncio.gather(*[
        session.read_resource(uri) for uri in uris
    ])

    return {uri: result for uri, result in zip(uris, results)}
```

### Rate Limiting

Respect server rate limits:

```typescript
class RateLimitedClient {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;

    constructor(
        private client: Client,
        private maxConcurrent = 5,
        private delayMs = 100
    ) {}

    async callTool(name: string, args: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await this.client.callTool({
                        name,
                        arguments: args
                    });
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });

            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const batch = this.queue.splice(0, this.maxConcurrent);
            await Promise.all(batch.map(fn => fn()));
            await new Promise(resolve => setTimeout(resolve, this.delayMs));
        }

        this.processing = false;
    }
}
```


## Production Client Implementation {#production-implementation}

Let's build a complete production-ready client with all patterns combined.

### Full-Featured Client (TypeScript)

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CreateMessageRequestSchema } from '@modelcontextprotocol/sdk/types.js';

class ProductionMCPClient {
    private client: Client;
    private transport: StreamableHTTPClientTransport;
    private circuitBreaker: CircuitBreaker;
    private isConnected = false;

    constructor(
        private serverUrl: string,
        private config: {
            maxRetries?: number;
            timeout?: number;
            healthCheckInterval?: number;
        } = {}
    ) {
        this.client = new Client({
            name: 'production-client',
            version: '1.0.0'
        });

        this.circuitBreaker = new CircuitBreaker(5, 60000);

        // Register sampling handler
        this.client.setRequestHandler(
            CreateMessageRequestSchema,
            this.handleSampling.bind(this)
        );
    }

    async connect(): Promise<void> {
        this.transport = new StreamableHTTPClientTransport(
            new URL(this.serverUrl)
        );

        await this.connectWithRetry();
        this.isConnected = true;

        if (this.config.healthCheckInterval) {
            this.startHealthCheck();
        }
    }

    private async connectWithRetry(): Promise<void> {
        const maxRetries = this.config.maxRetries || 3;
        let lastError: Error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.client.connect(this.transport);
                console.log('Connected successfully');
                return;
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    const delay = 1000 * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw new Error(`Connection failed: ${lastError}`);
    }

    async callTool(name: string, args: any): Promise<any> {
        if (!this.isConnected) {
            throw new Error('Client not connected');
        }

        return this.circuitBreaker.execute(async () => {
            const timeout = this.config.timeout || 30000;

            return this.withTimeout(
                this.client.callTool({ name, arguments: args }),
                timeout
            );
        });
    }

    async readResource(uri: string): Promise<any> {
        if (!this.isConnected) {
            throw new Error('Client not connected');
        }

        return this.circuitBreaker.execute(async () => {
            return this.client.readResource({ uri });
        });
    }

    private async handleSampling(request: any, extra: any) {
        // Integrate with your LLM provider
        const prompt = request.params.messages[0]?.content?.text || '';

        // Example: Call OpenAI, Anthropic, etc.
        // const response = await yourLLM.complete(prompt);

        return {
            role: 'assistant',
            content: { type: 'text', text: 'LLM response here' },
            model: 'your-model'
        };
    }

    private async withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number
    ): Promise<T> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), timeoutMs);
        });

        return Promise.race([promise, timeoutPromise]);
    }

    private startHealthCheck() {
        setInterval(async () => {
            try {
                await this.client.listTools();
            } catch (error) {
                console.error('Health check failed:', error);
                await this.reconnect();
            }
        }, this.config.healthCheckInterval);
    }

    private async reconnect() {
        this.isConnected = false;
        await this.client.close();
        await this.connect();
    }

    async close(): Promise<void> {
        this.isConnected = false;
        await this.client.close();
    }
}

// Usage
const client = new ProductionMCPClient('http://localhost:3000/mcp', {
    maxRetries: 3,
    timeout: 30000,
    healthCheckInterval: 60000
});

await client.connect();
const result = await client.callTool('add', { a: 5, b: 3 });
console.log(result);
await client.close();
```

### Logging and Monitoring

Add observability to your client:

```typescript
class ObservableClient extends ProductionMCPClient {
    private metrics = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalLatency: 0
    };

    async callTool(name: string, args: any): Promise<any> {
        const startTime = Date.now();
        this.metrics.totalCalls++;

        try {
            const result = await super.callTool(name, args);
            this.metrics.successfulCalls++;
            this.metrics.totalLatency += Date.now() - startTime;

            console.log({
                event: 'tool_call_success',
                tool: name,
                latency: Date.now() - startTime,
                timestamp: new Date().toISOString()
            });

            return result;
        } catch (error) {
            this.metrics.failedCalls++;

            console.error({
                event: 'tool_call_failure',
                tool: name,
                error: error.message,
                latency: Date.now() - startTime,
                timestamp: new Date().toISOString()
            });

            throw error;
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            averageLatency: this.metrics.totalLatency / this.metrics.totalCalls,
            successRate: this.metrics.successfulCalls / this.metrics.totalCalls
        };
    }
}
```


## Real-World Examples {#real-world-examples}

### Multi-Server Orchestration

Build a client that coordinates multiple MCP servers:

```typescript
class AIAssistant {
    private clients = new Map<string, ProductionMCPClient>();

    async initialize() {
        // Connect to multiple specialized servers
        await this.connectServer('database', 'http://localhost:3001/mcp');
        await this.connectServer('email', 'http://localhost:3002/mcp');
        await this.connectServer('analytics', 'http://localhost:3003/mcp');
    }

    private async connectServer(name: string, url: string) {
        const client = new ProductionMCPClient(url);
        await client.connect();
        this.clients.set(name, client);
    }

    async processUserRequest(request: string): Promise<string> {
        // Step 1: Query database
        const userData = await this.clients.get('database')!.callTool(
            'query-users',
            { query: request }
        );

        // Parse user data from content
        const userDataContent = userData.content[0].type === 'text'
            ? JSON.parse(userData.content[0].text)
            : null;

        // Step 2: Generate analytics
        const analytics = await this.clients.get('analytics')!.callTool(
            'analyze-data',
            { data: userDataContent }
        );

        // Step 3: Send email report
        await this.clients.get('email')!.callTool(
            'send-email',
            {
                to: 'user@example.com',
                subject: 'Analysis Complete',
                body: analytics.content[0].text
            }
        );

        return 'Request processed successfully';
    }

    async cleanup() {
        for (const [name, client] of this.clients) {
            await client.close();
        }
    }
}
```

### Adaptive Client with Fallbacks

Handle server failures gracefully:

```typescript
class AdaptiveClient {
    private primaryClient: ProductionMCPClient;
    private fallbackClient: ProductionMCPClient;

    async callToolWithFallback(name: string, args: any): Promise<any> {
        try {
            return await this.primaryClient.callTool(name, args);
        } catch (primaryError) {
            console.warn('Primary server failed, trying fallback:', primaryError);

            try {
                return await this.fallbackClient.callTool(name, args);
            } catch (fallbackError) {
                console.error('Both servers failed');
                throw new Error('All servers unavailable');
            }
        }
    }
}
```


## Best Practices and Patterns {#best-practices}

### Client Design Principles

1. **Fail Fast on Invalid State**: Don't attempt operations when disconnected
2. **Validate Before Sending**: Check arguments match tool schemas
3. **Log Extensively**: Every request, response, and error
4. **Monitor Metrics**: Track latency, success rates, error patterns
5. **Handle Cleanup**: Always close connections properly

### Security Checklist

✅ **Validate server certificates** (HTTPS)
✅ **Store credentials securely** (environment variables, vaults)
✅ **Implement request signing** for sensitive operations
✅ **Rate limit client requests** to prevent abuse
✅ **Sanitize user inputs** before passing to tools
✅ **Log security events** (auth failures, suspicious patterns)

### Performance Optimization

```typescript
class OptimizedClient {
    private toolCache = new Map<string, any>();

    async listToolsCached(): Promise<any> {
        const cacheKey = 'tools-list';

        if (this.toolCache.has(cacheKey)) {
            return this.toolCache.get(cacheKey);
        }

        const tools = await this.client.listTools();
        this.toolCache.set(cacheKey, tools);

        // Cache for 5 minutes
        setTimeout(() => this.toolCache.delete(cacheKey), 300000);

        return tools;
    }
}
```

### Testing Patterns

Mock MCP servers for unit tests:

```typescript
class MockMCPServer {
    private tools = new Map<string, Function>();

    registerTool(name: string, handler: Function) {
        this.tools.set(name, handler);
    }

    async callTool(name: string, args: any): Promise<any> {
        const handler = this.tools.get(name);
        if (!handler) {
            throw new Error(`Tool not found: ${name}`);
        }
        return handler(args);
    }
}

// In tests
const mockServer = new MockMCPServer();
mockServer.registerTool('add', (args) => ({
    content: [{ type: 'text', text: String(args.a + args.b) }]
}));
```


## What's Next {#whats-next}

You now have comprehensive knowledge of MCP client integration:

✅ **Session lifecycle**: Initialize, maintain, and close connections
✅ **Transport handling**: HTTP, STDIO, and resilient connection patterns
✅ **Tool calling**: Basic, structured output, and task-based execution
✅ **Resource access**: Discovery, reading, and dynamic templates
✅ **Sampling integration**: Enable server-driven LLM interactions
✅ **Error recovery**: Retries, circuit breakers, and timeouts
✅ **Async patterns**: Parallel execution, rate limiting, and concurrency
✅ **Production patterns**: Logging, monitoring, and security

### Coming in This Series

**Part 4: Advanced MCP Patterns** (Coming Soon)
- Multi-server orchestration strategies
- Caching and state management
- Performance optimization at scale
- Custom transport implementations

**Part 5: Real-World Applications** (Coming Soon)
- Building a customer service AI agent
- Data analysis assistant with multi-source integration
- Development productivity tools
- Enterprise knowledge management systems

### Your Challenge

Build a complete MCP client application:

1. **Connect to 3+ servers**: Database, API, and tool servers
2. **Implement error recovery**: Retries, circuit breakers, timeouts
3. **Add monitoring**: Metrics, logging, health checks
4. **Enable sampling**: Integrate with an LLM provider
5. **Handle concurrency**: Parallel tool calls and resource reads

Share your implementations with the MCP community!


## References and Citations

### Official Documentation

- [MCP TypeScript SDK - Client Implementation](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Python SDK - Client Session](https://github.com/modelcontextprotocol/python-sdk)
- [MCP Specification - Architecture](https://modelcontextprotocol.io/specification)

### Code Examples

All code examples adapted from official SDK documentation:

- Session management: [TypeScript SDK Examples](https://context7.com/modelcontextprotocol/typescript-sdk)
- Tool calling patterns: [Python SDK - Tool Documentation](https://github.com/modelcontextprotocol/python-sdk)
- Sampling integration: [Python SDK - Sampling Callbacks](https://github.com/modelcontextprotocol/python-sdk)
- Error handling: [Python SDK - Exception Handling](https://github.com/modelcontextprotocol/python-sdk)


**Published**: December 2025
**Tags**: #MCP #Client #Integration #AI #TypeScript #Python #Production
