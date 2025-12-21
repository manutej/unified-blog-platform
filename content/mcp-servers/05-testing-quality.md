---
title: "Testing MCP Applications: Quality Assurance Strategies"
subtitle: "Comprehensive guide to testing MCP servers and clients with practical patterns and automation strategies"
date: 2024-12-11
author: MCP Quality Engineering Team
series: "MCP Development Deep Dive"
level: "L2-L3 Developers"
topics:
  - Testing Strategies
  - Quality Assurance
  - Test Automation
  - CI/CD Integration
reading_time: "18 minutes"
---

# Testing MCP Applications: Quality Assurance Strategies

Building reliable Model Context Protocol (MCP) applications requires comprehensive testing strategies that go beyond traditional API testing. MCP's bidirectional communication patterns, streaming capabilities, and tool execution semantics demand specialized testing approaches that ensure both correctness and reliability.

This guide provides practical testing strategies for MCP developers, covering unit testing, integration testing, mocking strategies, and CI/CD automation with real-world examples from the MCP SDK ecosystem.

## Table of Contents

1. [Testing Fundamentals for MCP](#testing-fundamentals-for-mcp)
2. [The MCP Testing Pyramid](#the-mcp-testing-pyramid)
3. [Unit Testing MCP Servers](#unit-testing-mcp-servers)
4. [Unit Testing MCP Clients](#unit-testing-mcp-clients)
5. [Integration Testing Strategies](#integration-testing-strategies)
6. [Mocking and Test Doubles](#mocking-and-test-doubles)
7. [Testing Streaming Operations](#testing-streaming-operations)
8. [Test Automation and CI/CD](#test-automation-and-cicd)
9. [Quality Metrics and Gates](#quality-metrics-and-gates)
10. [Production Testing Patterns](#production-testing-patterns)

---

## Testing Fundamentals for MCP

### Why MCP Testing is Different

MCP applications present unique testing challenges compared to traditional REST APIs:

**Bidirectional Communication**: MCP supports client-to-server and server-to-client messaging, requiring tests that validate both directions.

**Streaming Data**: Tools and prompts can stream results, requiring tests that handle asynchronous data flows and partial results.

**Stateful Connections**: MCP maintains persistent connections with initialization handshakes, capability negotiation, and session state.

**Tool Execution Semantics**: Tools have complex input/output schemas, error handling, and execution contexts that must be validated.

**Transport Abstraction**: MCP works over multiple transports (stdio, HTTP/SSE), requiring transport-agnostic test strategies.

### Core Testing Principles

1. **Test Transport Independence**: Write tests that work regardless of underlying transport
2. **Validate Protocol Compliance**: Ensure strict adherence to MCP specification
3. **Test Error Handling**: Verify graceful degradation and error recovery
4. **Verify Capability Negotiation**: Test server/client capability matching
5. **Ensure Idempotency**: Validate that operations produce consistent results
6. **Test Concurrency**: Verify thread-safety and concurrent request handling

---

## The MCP Testing Pyramid

The traditional testing pyramid applies to MCP applications with adaptations for protocol-specific concerns:

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲         • Full integration tests
                 ╱Tests╲         • Real transport connections
                ╱────────╲       • End-to-end workflows
               ╱          ╲
              ╱Integration╲     • Protocol-level tests
             ╱    Tests    ╲    • Mock transports
            ╱────────────────╲  • Multi-component validation
           ╱                  ╱
          ╱   Unit Tests     ╱  • Individual tool tests
         ╱                  ╱   • Schema validation
        ╱__________________╱    • Business logic isolation
```

### MCP Testing Layers

**Unit Tests (70% of tests)**:
- Individual tool implementations
- Schema validation logic
- Business logic functions
- Error handling utilities
- Data transformation functions

**Integration Tests (20% of tests)**:
- Server initialization and capability negotiation
- Tool execution through protocol layer
- Resource listing and reading
- Prompt template rendering
- Transport abstraction validation

**End-to-End Tests (10% of tests)**:
- Full client-server workflows
- Real transport connections (stdio, HTTP)
- Multi-tool operations
- Session lifecycle management
- Production-like scenarios

---

## Unit Testing MCP Servers

### Testing Tool Implementations

Tool implementations are the most critical components to unit test. Here's a comprehensive example using the TypeScript SDK:

```typescript
// tools/calculator.ts
import { z } from 'zod';

export const AddToolSchema = z.object({
  a: z.number().describe('First number'),
  b: z.number().describe('Second number'),
});

export type AddToolInput = z.infer<typeof AddToolSchema>;

export async function addTool(input: AddToolInput): Promise<number> {
  if (!Number.isFinite(input.a) || !Number.isFinite(input.b)) {
    throw new Error('Invalid input: numbers must be finite');
  }
  return input.a + input.b;
}

// tools/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { addTool, AddToolSchema } from './calculator';

describe('Add Tool', () => {
  describe('Schema Validation', () => {
    it('validates correct input', () => {
      const result = AddToolSchema.safeParse({ a: 5, b: 3 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ a: 5, b: 3 });
      }
    });

    it('rejects non-numeric input', () => {
      const result = AddToolSchema.safeParse({ a: 'five', b: 3 });
      expect(result.success).toBe(false);
    });

    it('rejects missing parameters', () => {
      const result = AddToolSchema.safeParse({ a: 5 });
      expect(result.success).toBe(false);
    });

    it('includes parameter descriptions', () => {
      const shape = AddToolSchema.shape;
      expect(shape.a.description).toBe('First number');
      expect(shape.b.description).toBe('Second number');
    });
  });

  describe('Tool Execution', () => {
    it('adds positive numbers correctly', async () => {
      const result = await addTool({ a: 5, b: 3 });
      expect(result).toBe(8);
    });

    it('handles negative numbers', async () => {
      const result = await addTool({ a: -5, b: 3 });
      expect(result).toBe(-2);
    });

    it('handles decimal numbers', async () => {
      const result = await addTool({ a: 0.1, b: 0.2 });
      expect(result).toBeCloseTo(0.3, 10);
    });

    it('handles zero values', async () => {
      const result = await addTool({ a: 0, b: 0 });
      expect(result).toBe(0);
    });

    it('rejects infinite values', async () => {
      await expect(
        addTool({ a: Infinity, b: 3 })
      ).rejects.toThrow('Invalid input: numbers must be finite');
    });

    it('rejects NaN values', async () => {
      await expect(
        addTool({ a: NaN, b: 3 })
      ).rejects.toThrow('Invalid input: numbers must be finite');
    });
  });

  describe('Edge Cases', () => {
    it('handles very large numbers', async () => {
      const result = await addTool({
        a: Number.MAX_SAFE_INTEGER - 1,
        b: 1
      });
      expect(result).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('handles very small numbers', async () => {
      const result = await addTool({
        a: Number.MIN_VALUE,
        b: Number.MIN_VALUE
      });
      expect(result).toBeGreaterThan(0);
    });
  });
});
```

### Testing Resource Handlers

Resource handlers require testing list and read operations:

```typescript
// resources/file-system.ts
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

export const FileResourceSchema = z.object({
  uri: z.string().regex(/^file:\/\//),
});

export async function listFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter(entry => entry.isFile())
    .map(entry => `file://${path.join(directory, entry.name)}`);
}

export async function readFile(uri: string): Promise<string> {
  const filePath = uri.replace(/^file:\/\//, '');

  // Security: prevent directory traversal
  const normalized = path.normalize(filePath);
  if (normalized.includes('..')) {
    throw new Error('Invalid path: directory traversal not allowed');
  }

  return await fs.readFile(normalized, 'utf-8');
}

// resources/file-system.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { listFiles, readFile, FileResourceSchema } from './file-system';

describe('File System Resources', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));

    // Create test files
    await fs.writeFile(path.join(testDir, 'test1.txt'), 'Content 1');
    await fs.writeFile(path.join(testDir, 'test2.txt'), 'Content 2');
    await fs.mkdir(path.join(testDir, 'subdir'));
    await fs.writeFile(path.join(testDir, 'subdir', 'test3.txt'), 'Content 3');
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('List Files', () => {
    it('lists all files in directory', async () => {
      const files = await listFiles(testDir);
      expect(files).toHaveLength(2);
      expect(files).toContain(`file://${path.join(testDir, 'test1.txt')}`);
      expect(files).toContain(`file://${path.join(testDir, 'test2.txt')}`);
    });

    it('excludes subdirectories', async () => {
      const files = await listFiles(testDir);
      expect(files.some(f => f.includes('subdir'))).toBe(false);
    });

    it('handles empty directory', async () => {
      const emptyDir = path.join(testDir, 'empty');
      await fs.mkdir(emptyDir);
      const files = await listFiles(emptyDir);
      expect(files).toHaveLength(0);
    });

    it('throws error for non-existent directory', async () => {
      await expect(
        listFiles('/non/existent/path')
      ).rejects.toThrow();
    });
  });

  describe('Read File', () => {
    it('reads file content correctly', async () => {
      const uri = `file://${path.join(testDir, 'test1.txt')}`;
      const content = await readFile(uri);
      expect(content).toBe('Content 1');
    });

    it('validates URI schema', () => {
      const result = FileResourceSchema.safeParse({
        uri: `file://${path.join(testDir, 'test1.txt')}`
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-file URIs', () => {
      const result = FileResourceSchema.safeParse({
        uri: 'http://example.com/file.txt'
      });
      expect(result.success).toBe(false);
    });

    it('prevents directory traversal attacks', async () => {
      const maliciousUri = `file://${testDir}/../../../etc/passwd`;
      await expect(
        readFile(maliciousUri)
      ).rejects.toThrow('directory traversal not allowed');
    });

    it('handles non-existent files', async () => {
      const uri = `file://${path.join(testDir, 'nonexistent.txt')}`;
      await expect(readFile(uri)).rejects.toThrow();
    });

    it('handles UTF-8 content', async () => {
      const unicodePath = path.join(testDir, 'unicode.txt');
      await fs.writeFile(unicodePath, '你好世界 🌍');
      const content = await readFile(`file://${unicodePath}`);
      expect(content).toBe('你好世界 🌍');
    });
  });
});
```

### Testing Prompt Templates

Prompt templates require validation of template rendering and argument handling:

```typescript
// prompts/code-review.ts
export interface CodeReviewArgs {
  code: string;
  language: string;
  focus?: 'security' | 'performance' | 'style' | 'all';
}

export function renderCodeReviewPrompt(args: CodeReviewArgs): string {
  const focus = args.focus || 'all';

  const focusInstructions = {
    security: 'Focus on security vulnerabilities and potential exploits.',
    performance: 'Focus on performance bottlenecks and optimization opportunities.',
    style: 'Focus on code style, readability, and best practices.',
    all: 'Provide comprehensive review covering security, performance, and style.'
  };

  return `You are a code reviewer. Review the following ${args.language} code.

${focusInstructions[focus]}

Code to review:
\`\`\`${args.language}
${args.code}
\`\`\`

Provide your review as a structured analysis with specific recommendations.`;
}

// prompts/code-review.test.ts
import { describe, it, expect } from 'vitest';
import { renderCodeReviewPrompt } from './code-review';

describe('Code Review Prompt', () => {
  const sampleCode = `
function add(a, b) {
  return a + b;
}
`.trim();

  describe('Template Rendering', () => {
    it('includes language in output', () => {
      const prompt = renderCodeReviewPrompt({
        code: sampleCode,
        language: 'javascript'
      });

      expect(prompt).toContain('javascript');
      expect(prompt).toContain('```javascript');
    });

    it('includes code in code block', () => {
      const prompt = renderCodeReviewPrompt({
        code: sampleCode,
        language: 'javascript'
      });

      expect(prompt).toContain(sampleCode);
    });

    it('uses default focus when not specified', () => {
      const prompt = renderCodeReviewPrompt({
        code: sampleCode,
        language: 'javascript'
      });

      expect(prompt).toContain('comprehensive review');
    });

    it('applies security focus', () => {
      const prompt = renderCodeReviewPrompt({
        code: sampleCode,
        language: 'javascript',
        focus: 'security'
      });

      expect(prompt).toContain('security vulnerabilities');
      expect(prompt).not.toContain('performance');
    });

    it('applies performance focus', () => {
      const prompt = renderCodeReviewPrompt({
        code: sampleCode,
        language: 'javascript',
        focus: 'performance'
      });

      expect(prompt).toContain('performance bottlenecks');
      expect(prompt).not.toContain('security');
    });

    it('applies style focus', () => {
      const prompt = renderCodeReviewPrompt({
        code: sampleCode,
        language: 'javascript',
        focus: 'style'
      });

      expect(prompt).toContain('code style');
      expect(prompt).not.toContain('security');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty code', () => {
      const prompt = renderCodeReviewPrompt({
        code: '',
        language: 'javascript'
      });

      expect(prompt).toContain('```javascript');
    });

    it('handles multiline code', () => {
      const multilineCode = `function complex() {
  if (true) {
    return 42;
  }
}`;

      const prompt = renderCodeReviewPrompt({
        code: multilineCode,
        language: 'javascript'
      });

      expect(prompt).toContain(multilineCode);
    });

    it('handles special characters in code', () => {
      const specialCode = 'const regex = /[a-z]$/;';

      const prompt = renderCodeReviewPrompt({
        code: specialCode,
        language: 'javascript'
      });

      expect(prompt).toContain(specialCode);
    });
  });
});
```

---

## Unit Testing MCP Clients

### Testing Client Initialization

Client initialization requires testing capability negotiation and connection setup:

```typescript
// client/mcp-client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface ClientConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export async function createMCPClient(config: ClientConfig): Promise<Client> {
  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args || [],
    env: config.env,
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    }
  });

  await client.connect(transport);
  return client;
}

// client/mcp-client.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createMCPClient } from './mcp-client';

// Mock the SDK
vi.mock('@modelcontextprotocol/sdk/client/index.js');
vi.mock('@modelcontextprotocol/sdk/client/stdio.js');

describe('MCP Client', () => {
  let mockClient: any;
  let mockTransport: any;

  beforeEach(() => {
    // Reset mocks
    mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockTransport = {
      start: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(Client).mockImplementation(() => mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Client Creation', () => {
    it('creates client with correct configuration', async () => {
      const config = {
        command: 'node',
        args: ['server.js'],
      };

      await createMCPClient(config);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-client',
          version: '1.0.0',
        }),
        expect.objectContaining({
          capabilities: expect.objectContaining({
            tools: {},
            resources: {},
            prompts: {},
          })
        })
      );
    });

    it('connects transport to client', async () => {
      const config = {
        command: 'node',
        args: ['server.js'],
      };

      await createMCPClient(config);

      expect(mockClient.connect).toHaveBeenCalledTimes(1);
    });

    it('handles connection errors', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));

      const config = {
        command: 'invalid-command',
      };

      await expect(createMCPClient(config)).rejects.toThrow('Connection failed');
    });

    it('passes environment variables to transport', async () => {
      const config = {
        command: 'node',
        args: ['server.js'],
        env: {
          DEBUG: 'true',
          API_KEY: 'test-key',
        },
      };

      await createMCPClient(config);

      // Verify transport was created with env
      const StdioClientTransport = (await import(
        '@modelcontextprotocol/sdk/client/stdio.js'
      )).StdioClientTransport;

      expect(StdioClientTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          env: {
            DEBUG: 'true',
            API_KEY: 'test-key',
          }
        })
      );
    });
  });
});
```

### Testing Tool Execution

Client tool execution requires testing request formatting, response parsing, and error handling:

```typescript
// client/tool-executor.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export async function executeTool(
  client: Client,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const response = await client.callTool({
    name: toolName,
    arguments: args,
  });

  return response;
}

// client/tool-executor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { executeTool } from './tool-executor';

describe('Tool Executor', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      callTool: vi.fn(),
    };
  });

  describe('Tool Execution', () => {
    it('calls tool with correct parameters', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: 'Result' }],
      });

      await executeTool(mockClient, 'add', { a: 5, b: 3 });

      expect(mockClient.callTool).toHaveBeenCalledWith({
        name: 'add',
        arguments: { a: 5, b: 3 },
      });
    });

    it('returns tool result', async () => {
      const expectedResult = {
        content: [{ type: 'text' as const, text: 'Sum: 8' }],
      };

      mockClient.callTool.mockResolvedValue(expectedResult);

      const result = await executeTool(mockClient, 'add', { a: 5, b: 3 });

      expect(result).toEqual(expectedResult);
    });

    it('handles error responses', async () => {
      const errorResult = {
        content: [{ type: 'text' as const, text: 'Invalid input' }],
        isError: true,
      };

      mockClient.callTool.mockResolvedValue(errorResult);

      const result = await executeTool(mockClient, 'add', { a: 'invalid', b: 3 });

      expect(result.isError).toBe(true);
    });

    it('handles tool not found', async () => {
      mockClient.callTool.mockRejectedValue(
        new Error('Tool not found: nonexistent')
      );

      await expect(
        executeTool(mockClient, 'nonexistent', {})
      ).rejects.toThrow('Tool not found');
    });

    it('handles network errors', async () => {
      mockClient.callTool.mockRejectedValue(
        new Error('Network error: ECONNREFUSED')
      );

      await expect(
        executeTool(mockClient, 'add', { a: 5, b: 3 })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Result Types', () => {
    it('handles text results', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{ type: 'text', text: 'Hello' }],
      });

      const result = await executeTool(mockClient, 'greet', { name: 'Alice' });

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe('Hello');
    });

    it('handles image results', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [{
          type: 'image',
          data: 'base64-encoded-data',
          mimeType: 'image/png',
        }],
      });

      const result = await executeTool(mockClient, 'screenshot', {});

      expect(result.content[0].type).toBe('image');
      expect(result.content[0].mimeType).toBe('image/png');
    });

    it('handles multiple content items', async () => {
      mockClient.callTool.mockResolvedValue({
        content: [
          { type: 'text', text: 'Analysis:' },
          { type: 'text', text: 'Result 1' },
          { type: 'text', text: 'Result 2' },
        ],
      });

      const result = await executeTool(mockClient, 'analyze', { data: 'test' });

      expect(result.content).toHaveLength(3);
    });
  });
});
```

---

## Integration Testing Strategies

### Testing Protocol Communication

Integration tests validate full protocol message exchange:

```typescript
// integration/protocol.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';

describe('MCP Protocol Integration', () => {
  let serverProcess: ChildProcess;
  let client: Client;

  beforeAll(async () => {
    // Start server process
    serverProcess = spawn('node', ['dist/server.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create client
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['dist/server.js'],
    });

    client = new Client({
      name: 'integration-test-client',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      }
    });

    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
    serverProcess.kill();
  });

  describe('Initialization', () => {
    it('completes capability negotiation', async () => {
      const serverCapabilities = await client.getServerCapabilities();

      expect(serverCapabilities).toBeDefined();
      expect(serverCapabilities.tools).toBeDefined();
    });

    it('exchanges server info', async () => {
      const serverInfo = await client.getServerVersion();

      expect(serverInfo.name).toBeDefined();
      expect(serverInfo.version).toBeDefined();
    });
  });

  describe('Tool Operations', () => {
    it('lists available tools', async () => {
      const tools = await client.listTools();

      expect(tools.tools).toBeInstanceOf(Array);
      expect(tools.tools.length).toBeGreaterThan(0);
    });

    it('executes tool successfully', async () => {
      const result = await client.callTool({
        name: 'add',
        arguments: { a: 5, b: 3 },
      });

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('8');
    });

    it('handles tool errors gracefully', async () => {
      const result = await client.callTool({
        name: 'add',
        arguments: { a: 'invalid', b: 3 },
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('Resource Operations', () => {
    it('lists available resources', async () => {
      const resources = await client.listResources();

      expect(resources.resources).toBeInstanceOf(Array);
    });

    it('reads resource content', async () => {
      const resources = await client.listResources();
      const firstResource = resources.resources[0];

      const content = await client.readResource({
        uri: firstResource.uri,
      });

      expect(content.contents).toBeInstanceOf(Array);
      expect(content.contents.length).toBeGreaterThan(0);
    });
  });

  describe('Prompt Operations', () => {
    it('lists available prompts', async () => {
      const prompts = await client.listPrompts();

      expect(prompts.prompts).toBeInstanceOf(Array);
    });

    it('retrieves prompt with arguments', async () => {
      const prompt = await client.getPrompt({
        name: 'code-review',
        arguments: {
          code: 'function test() {}',
          language: 'javascript',
        },
      });

      expect(prompt.messages).toBeInstanceOf(Array);
      expect(prompt.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles invalid tool name', async () => {
      await expect(
        client.callTool({
          name: 'nonexistent-tool',
          arguments: {},
        })
      ).rejects.toThrow();
    });

    it('handles malformed arguments', async () => {
      const result = await client.callTool({
        name: 'add',
        arguments: { invalid: 'args' },
      });

      expect(result.isError).toBe(true);
    });

    it('handles invalid resource URI', async () => {
      await expect(
        client.readResource({
          uri: 'invalid://uri',
        })
      ).rejects.toThrow();
    });
  });

  describe('Concurrency', () => {
    it('handles concurrent tool calls', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        client.callTool({
          name: 'add',
          arguments: { a: i, b: 1 },
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.content[0].text).toContain(String(i + 1));
      });
    });

    it('handles concurrent resource reads', async () => {
      const resources = await client.listResources();

      const promises = resources.resources.map(resource =>
        client.readResource({ uri: resource.uri })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(resources.resources.length);
    });
  });
});
```

### Testing Transport Abstraction

Validate that servers work correctly across different transports:

```typescript
// integration/transport.test.ts
import { describe, it, expect } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

async function testServerOnTransport(
  createTransport: () => Promise<any>,
  transportName: string
) {
  describe(`${transportName} Transport`, () => {
    it('initializes server correctly', async () => {
      const server = new Server({
        name: 'test-server',
        version: '1.0.0',
      }, {
        capabilities: {
          tools: {},
        }
      });

      const transport = await createTransport();

      await expect(
        server.connect(transport)
      ).resolves.not.toThrow();
    });

    it('handles tool registration', async () => {
      const server = new Server({
        name: 'test-server',
        version: '1.0.0',
      }, {
        capabilities: {
          tools: {},
        }
      });

      server.setRequestHandler('tools/list', async () => ({
        tools: [{
          name: 'test-tool',
          description: 'Test tool',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        }],
      }));

      const transport = await createTransport();
      await server.connect(transport);

      // Transport should be connected
      expect(transport.isConnected).toBe(true);
    });
  });
}

// Test stdio transport
testServerOnTransport(
  async () => new StdioServerTransport(),
  'Stdio'
);

// Test SSE transport
testServerOnTransport(
  async () => new SSEServerTransport('/sse', async (res) => res),
  'SSE'
);
```

---

## Mocking and Test Doubles

### Mock Transport Implementation

Create lightweight mock transports for fast unit testing:

```typescript
// test-utils/mock-transport.ts
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

export class MockTransport implements Transport {
  private messageHandlers: Map<string, (message: any) => void> = new Map();
  private sentMessages: any[] = [];
  public isConnected: boolean = false;

  async start(): Promise<void> {
    this.isConnected = true;
  }

  async close(): Promise<void> {
    this.isConnected = false;
  }

  async send(message: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Transport not connected');
    }
    this.sentMessages.push(message);
  }

  onmessage(handler: (message: any) => void): void {
    this.messageHandlers.set('message', handler);
  }

  onerror(handler: (error: Error) => void): void {
    this.messageHandlers.set('error', handler);
  }

  onclose(handler: () => void): void {
    this.messageHandlers.set('close', handler);
  }

  // Test utilities
  simulateMessage(message: any): void {
    const handler = this.messageHandlers.get('message');
    if (handler) {
      handler(message);
    }
  }

  simulateError(error: Error): void {
    const handler = this.messageHandlers.get('error');
    if (handler) {
      handler(error);
    }
  }

  simulateClose(): void {
    const handler = this.messageHandlers.get('close');
    if (handler) {
      handler();
    }
    this.isConnected = false;
  }

  getSentMessages(): any[] {
    return [...this.sentMessages];
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }
}

// Usage in tests
import { describe, it, expect } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { MockTransport } from './test-utils/mock-transport';

describe('Server with Mock Transport', () => {
  it('sends initialization message', async () => {
    const server = new Server({
      name: 'test-server',
      version: '1.0.0',
    }, {
      capabilities: { tools: {} }
    });

    const transport = new MockTransport();
    await server.connect(transport);

    const messages = transport.getSentMessages();
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].method).toBe('initialize');
  });

  it('handles incoming tool call', async () => {
    const server = new Server({
      name: 'test-server',
      version: '1.0.0',
    }, {
      capabilities: { tools: {} }
    });

    let toolCalled = false;
    server.setRequestHandler('tools/call', async (request) => {
      toolCalled = true;
      return {
        content: [{ type: 'text', text: 'Success' }],
      };
    });

    const transport = new MockTransport();
    await server.connect(transport);

    // Simulate incoming tool call
    transport.simulateMessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'test-tool',
        arguments: {},
      },
    });

    // Wait for async handling
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(toolCalled).toBe(true);
  });
});
```

### Mock Client Implementation

Create mock clients for testing server responses:

```typescript
// test-utils/mock-client.ts
export class MockMCPClient {
  private tools: Map<string, any> = new Map();
  private resources: Map<string, any> = new Map();
  private prompts: Map<string, any> = new Map();

  // Setup methods
  registerTool(name: string, handler: (args: any) => Promise<any>): void {
    this.tools.set(name, handler);
  }

  registerResource(uri: string, content: string): void {
    this.resources.set(uri, content);
  }

  registerPrompt(name: string, template: (args: any) => string): void {
    this.prompts.set(name, template);
  }

  // Client methods
  async listTools(): Promise<any> {
    return {
      tools: Array.from(this.tools.keys()).map(name => ({
        name,
        description: `Mock tool: ${name}`,
        inputSchema: { type: 'object', properties: {} },
      })),
    };
  }

  async callTool(request: { name: string; arguments: any }): Promise<any> {
    const handler = this.tools.get(request.name);
    if (!handler) {
      throw new Error(`Tool not found: ${request.name}`);
    }
    return handler(request.arguments);
  }

  async listResources(): Promise<any> {
    return {
      resources: Array.from(this.resources.keys()).map(uri => ({
        uri,
        name: uri.split('/').pop(),
      })),
    };
  }

  async readResource(request: { uri: string }): Promise<any> {
    const content = this.resources.get(request.uri);
    if (!content) {
      throw new Error(`Resource not found: ${request.uri}`);
    }
    return {
      contents: [{ type: 'text', text: content }],
    };
  }

  async getPrompt(request: { name: string; arguments?: any }): Promise<any> {
    const template = this.prompts.get(request.name);
    if (!template) {
      throw new Error(`Prompt not found: ${request.name}`);
    }
    return {
      messages: [{
        role: 'user',
        content: { type: 'text', text: template(request.arguments || {}) },
      }],
    };
  }
}

// Usage in tests
import { describe, it, expect } from 'vitest';
import { MockMCPClient } from './test-utils/mock-client';

describe('Application with Mock Client', () => {
  it('processes tool results correctly', async () => {
    const client = new MockMCPClient();

    client.registerTool('add', async (args) => ({
      content: [{ type: 'text', text: String(args.a + args.b) }],
    }));

    const result = await client.callTool({
      name: 'add',
      arguments: { a: 5, b: 3 },
    });

    expect(result.content[0].text).toBe('8');
  });

  it('handles resource reading', async () => {
    const client = new MockMCPClient();

    client.registerResource('file:///test.txt', 'Test content');

    const result = await client.readResource({
      uri: 'file:///test.txt',
    });

    expect(result.contents[0].text).toBe('Test content');
  });
});
```

---

## Testing Streaming Operations

### Testing Streaming Tool Results

Handle progressive results and partial updates:

```typescript
// tools/streaming-search.ts
import { z } from 'zod';

export const SearchToolSchema = z.object({
  query: z.string(),
  maxResults: z.number().optional(),
});

export async function* searchTool(
  input: z.infer<typeof SearchToolSchema>
): AsyncGenerator<string> {
  const maxResults = input.maxResults || 10;

  // Simulate progressive search results
  for (let i = 0; i < maxResults; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    yield `Result ${i + 1}: ${input.query} - item ${i + 1}`;
  }
}

// tools/streaming-search.test.ts
import { describe, it, expect } from 'vitest';
import { searchTool, SearchToolSchema } from './streaming-search';

describe('Streaming Search Tool', () => {
  describe('Schema Validation', () => {
    it('validates correct input', () => {
      const result = SearchToolSchema.safeParse({
        query: 'test',
        maxResults: 5,
      });
      expect(result.success).toBe(true);
    });

    it('uses default maxResults', () => {
      const result = SearchToolSchema.safeParse({ query: 'test' });
      expect(result.success).toBe(true);
    });
  });

  describe('Streaming Results', () => {
    it('yields correct number of results', async () => {
      const results: string[] = [];

      for await (const result of searchTool({ query: 'test', maxResults: 3 })) {
        results.push(result);
      }

      expect(results).toHaveLength(3);
    });

    it('includes query in results', async () => {
      const results: string[] = [];

      for await (const result of searchTool({ query: 'typescript' })) {
        results.push(result);
      }

      results.forEach(result => {
        expect(result).toContain('typescript');
      });
    });

    it('yields results progressively', async () => {
      const timestamps: number[] = [];

      for await (const result of searchTool({ query: 'test', maxResults: 3 })) {
        timestamps.push(Date.now());
      }

      // Verify results came progressively (at least 50ms apart)
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i] - timestamps[i - 1]).toBeGreaterThanOrEqual(50);
      }
    });

    it('handles early termination', async () => {
      const results: string[] = [];

      for await (const result of searchTool({ query: 'test', maxResults: 10 })) {
        results.push(result);
        if (results.length === 3) break; // Early termination
      }

      expect(results).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('handles empty query', async () => {
      const results: string[] = [];

      for await (const result of searchTool({ query: '', maxResults: 3 })) {
        results.push(result);
      }

      expect(results).toHaveLength(3);
    });

    it('handles zero maxResults', async () => {
      const results: string[] = [];

      for await (const result of searchTool({ query: 'test', maxResults: 0 })) {
        results.push(result);
      }

      expect(results).toHaveLength(0);
    });
  });
});
```

### Testing Streaming Progress Updates

Test progress notifications and cancellation:

```typescript
// tools/long-running-task.ts
export interface ProgressUpdate {
  percentage: number;
  message: string;
}

export async function* longRunningTask(
  onProgress?: (update: ProgressUpdate) => void
): AsyncGenerator<string> {
  const steps = ['Initializing', 'Processing', 'Finalizing'];

  for (let i = 0; i < steps.length; i++) {
    const percentage = Math.round(((i + 1) / steps.length) * 100);

    if (onProgress) {
      onProgress({ percentage, message: steps[i] });
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    yield `Completed: ${steps[i]}`;
  }
}

// tools/long-running-task.test.ts
import { describe, it, expect, vi } from 'vitest';
import { longRunningTask, ProgressUpdate } from './long-running-task';

describe('Long Running Task', () => {
  it('reports progress updates', async () => {
    const progressUpdates: ProgressUpdate[] = [];
    const onProgress = vi.fn((update: ProgressUpdate) => {
      progressUpdates.push(update);
    });

    const results: string[] = [];
    for await (const result of longRunningTask(onProgress)) {
      results.push(result);
    }

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(progressUpdates).toEqual([
      { percentage: 33, message: 'Initializing' },
      { percentage: 67, message: 'Processing' },
      { percentage: 100, message: 'Finalizing' },
    ]);
  });

  it('works without progress callback', async () => {
    const results: string[] = [];

    for await (const result of longRunningTask()) {
      results.push(result);
    }

    expect(results).toHaveLength(3);
  });

  it('allows cancellation', async () => {
    const results: string[] = [];

    for await (const result of longRunningTask()) {
      results.push(result);
      if (results.length === 2) break; // Cancel after 2 steps
    }

    expect(results).toHaveLength(2);
  });
});
```

---

## Test Automation and CI/CD

### GitHub Actions Workflow

Comprehensive CI/CD pipeline for MCP applications:

```yaml
# .github/workflows/test.yml
name: MCP Server Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test on Node.js ${{ matrix.node-version }}
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint code
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-${{ matrix.node-version }}

      - name: Build project
        run: npm run build

      - name: Test built artifacts
        run: npm run test:build

  protocol-compliance:
    name: MCP Protocol Compliance
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'

      - name: Install dependencies
        run: npm ci

      - name: Build server
        run: npm run build

      - name: Run protocol validator
        run: npx @modelcontextprotocol/protocol-validator dist/server.js

      - name: Test stdio transport
        run: npm run test:transport:stdio

      - name: Test SSE transport
        run: npm run test:transport:sse

  security:
    name: Security Audit
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'

      - name: Audit dependencies
        run: npm audit --audit-level=moderate

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

  performance:
    name: Performance Benchmarks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'

      - name: Install dependencies
        run: npm ci

      - name: Build server
        run: npm run build

      - name: Run benchmarks
        run: npm run benchmark

      - name: Store benchmark results
        uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'benchmarkjs'
          output-file-path: benchmark-results.json
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Package.json Test Scripts

Organize test commands for different scenarios:

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run src/**/*.test.ts",
    "test:integration": "vitest run integration/**/*.test.ts",
    "test:e2e": "vitest run e2e/**/*.test.ts",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:build": "node scripts/test-built-server.js",
    "test:transport:stdio": "node scripts/test-stdio-transport.js",
    "test:transport:sse": "node scripts/test-sse-transport.js",
    "benchmark": "node scripts/run-benchmarks.js",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit",
    "validate": "npm run lint && npm run type-check && npm test"
  }
}
```

### Pre-commit Hooks

Ensure code quality before commits:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run validate"
    }
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

---

## Quality Metrics and Gates

### Coverage Requirements

Define minimum coverage thresholds:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    // Fail tests on console warnings
    onConsoleLog(log, type) {
      if (type === 'stderr' && log.includes('Warning')) {
        throw new Error(`Console warning detected: ${log}`);
      }
    },
  },
});
```

### Quality Gate Script

Automated quality checks before deployment:

```typescript
// scripts/quality-gate.ts
import { execSync } from 'child_process';
import * as fs from 'fs';

interface QualityMetrics {
  coverage: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  testResults: {
    total: number;
    passed: number;
    failed: number;
  };
  lintErrors: number;
  typeErrors: number;
}

async function runQualityGate(): Promise<void> {
  console.log('🚦 Running Quality Gate Checks...\n');

  const metrics: QualityMetrics = {
    coverage: { lines: 0, branches: 0, functions: 0, statements: 0 },
    testResults: { total: 0, passed: 0, failed: 0 },
    lintErrors: 0,
    typeErrors: 0,
  };

  // Run tests with coverage
  console.log('📊 Running tests with coverage...');
  try {
    execSync('npm run test:coverage', { stdio: 'inherit' });

    const coverageData = JSON.parse(
      fs.readFileSync('coverage/coverage-summary.json', 'utf-8')
    );

    const total = coverageData.total;
    metrics.coverage = {
      lines: total.lines.pct,
      branches: total.branches.pct,
      functions: total.functions.pct,
      statements: total.statements.pct,
    };
  } catch (error) {
    console.error('❌ Tests failed');
    process.exit(1);
  }

  // Run linter
  console.log('\n🔍 Running linter...');
  try {
    execSync('npm run lint', { stdio: 'pipe' });
    console.log('✅ No lint errors');
  } catch (error: any) {
    const output = error.stdout?.toString() || '';
    const errorCount = (output.match(/error/gi) || []).length;
    metrics.lintErrors = errorCount;
    console.error(`❌ ${errorCount} lint errors found`);
  }

  // Run type checker
  console.log('\n🔧 Running type checker...');
  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    console.log('✅ No type errors');
  } catch (error: any) {
    const output = error.stdout?.toString() || '';
    const errorCount = (output.match(/error TS/g) || []).length;
    metrics.typeErrors = errorCount;
    console.error(`❌ ${errorCount} type errors found`);
  }

  // Evaluate quality gates
  console.log('\n📈 Quality Metrics:');
  console.log(`   Coverage: ${metrics.coverage.lines.toFixed(1)}% lines, ${metrics.coverage.branches.toFixed(1)}% branches`);
  console.log(`   Lint Errors: ${metrics.lintErrors}`);
  console.log(`   Type Errors: ${metrics.typeErrors}`);

  const passed =
    metrics.coverage.lines >= 80 &&
    metrics.coverage.branches >= 75 &&
    metrics.lintErrors === 0 &&
    metrics.typeErrors === 0;

  if (passed) {
    console.log('\n✅ Quality gate PASSED');
    process.exit(0);
  } else {
    console.log('\n❌ Quality gate FAILED');
    process.exit(1);
  }
}

runQualityGate();
```

---

## Production Testing Patterns

### Health Check Testing

Validate server health and readiness:

```typescript
// health/health-check.ts
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    transport: boolean;
    tools: boolean;
    resources: boolean;
  };
  uptime: number;
  version: string;
}

export async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();

  const checks = {
    transport: await checkTransport(),
    tools: await checkTools(),
    resources: await checkResources(),
  };

  const allHealthy = Object.values(checks).every(check => check);
  const anyHealthy = Object.values(checks).some(check => check);

  return {
    status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
    checks,
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.0.0',
  };
}

async function checkTransport(): Promise<boolean> {
  // Verify transport is connected and responsive
  return true;
}

async function checkTools(): Promise<boolean> {
  // Verify tools are registered and callable
  return true;
}

async function checkResources(): Promise<boolean> {
  // Verify resources are accessible
  return true;
}

// health/health-check.test.ts
import { describe, it, expect, vi } from 'vitest';
import { performHealthCheck } from './health-check';

describe('Health Check', () => {
  it('reports healthy status when all checks pass', async () => {
    const health = await performHealthCheck();

    expect(health.status).toBe('healthy');
    expect(health.checks.transport).toBe(true);
    expect(health.checks.tools).toBe(true);
    expect(health.checks.resources).toBe(true);
  });

  it('includes uptime in response', async () => {
    const health = await performHealthCheck();

    expect(health.uptime).toBeGreaterThan(0);
  });

  it('includes version in response', async () => {
    const health = await performHealthCheck();

    expect(health.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
```

### Smoke Testing

Quick validation of critical functionality:

```typescript
// smoke/smoke-test.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export async function runSmokeTest(serverCommand: string): Promise<boolean> {
  console.log('🔥 Running smoke tests...');

  try {
    // Test 1: Server starts
    console.log('  ✓ Test 1: Server initialization...');
    const transport = new StdioClientTransport({
      command: serverCommand,
      args: [],
    });

    const client = new Client({
      name: 'smoke-test',
      version: '1.0.0',
    }, {
      capabilities: { tools: {} }
    });

    await client.connect(transport);
    console.log('    ✅ Server started successfully');

    // Test 2: List tools
    console.log('  ✓ Test 2: Tool discovery...');
    const tools = await client.listTools();
    if (tools.tools.length === 0) {
      throw new Error('No tools registered');
    }
    console.log(`    ✅ Found ${tools.tools.length} tools`);

    // Test 3: Execute tool
    console.log('  ✓ Test 3: Tool execution...');
    const result = await client.callTool({
      name: tools.tools[0].name,
      arguments: {},
    });
    if (!result.content) {
      throw new Error('Tool returned no content');
    }
    console.log('    ✅ Tool executed successfully');

    // Test 4: Resource listing
    console.log('  ✓ Test 4: Resource discovery...');
    const resources = await client.listResources();
    console.log(`    ✅ Found ${resources.resources.length} resources`);

    // Cleanup
    await client.close();

    console.log('\n✅ All smoke tests passed');
    return true;
  } catch (error) {
    console.error('\n❌ Smoke test failed:', error);
    return false;
  }
}

// Run smoke test
if (require.main === module) {
  const serverCommand = process.argv[2] || 'node dist/server.js';
  runSmokeTest(serverCommand)
    .then(passed => process.exit(passed ? 0 : 1));
}
```

---

## Visual Concepts Summary

### Testing Pyramid
```
        E2E Tests (10%)
    ┌───────────────────┐
    │ Full Integration  │
    │ Real Transports   │
    └───────────────────┘
         ╱         ╲
        ╱           ╲
   Integration Tests (20%)
  ┌─────────────────────┐
  │  Protocol Layer     │
  │  Mock Transports    │
  │  Multi-component    │
  └─────────────────────┘
        ╱             ╲
       ╱               ╲
    Unit Tests (70%)
  ┌───────────────────────┐
  │  Individual Tools     │
  │  Schema Validation    │
  │  Business Logic       │
  │  Error Handling       │
  └───────────────────────┘
```

### CI/CD Pipeline
```
┌─────────────┐
│   Commit    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Lint & TC  │────❌──→ [Block]
└──────┬──────┘
       │ ✅
       ▼
┌─────────────┐
│ Unit Tests  │────❌──→ [Block]
└──────┬──────┘
       │ ✅
       ▼
┌─────────────┐
│ Integration │────❌──→ [Block]
│    Tests    │
└──────┬──────┘
       │ ✅
       ▼
┌─────────────┐
│  Coverage   │────❌──→ [Block]
│   Check     │
└──────┬──────┘
       │ ✅
       ▼
┌─────────────┐
│  Protocol   │────❌──→ [Block]
│ Compliance  │
└──────┬──────┘
       │ ✅
       ▼
┌─────────────┐
│   Deploy    │
└─────────────┘
```

### Mock Architecture
```
┌─────────────────────────────────┐
│      Application Code           │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────┐
    │  MCP Client    │
    │   Interface    │
    └────────┬───────┘
             │
   ┌─────────┴──────────┐
   │                    │
   ▼                    ▼
┌──────────┐    ┌──────────────┐
│   Real   │    │ Mock Client  │
│  Client  │    │  (Testing)   │
└────┬─────┘    └──────┬───────┘
     │                 │
     │         ┌───────┴────────┐
     │         │ Predefined     │
     │         │ Responses      │
     │         │ Error Scenarios│
     │         │ Spy/Assertions │
     │         └────────────────┘
     ▼
┌──────────┐
│   Real   │
│  Server  │
└──────────┘
```

### Quality Gates
```
┌──────────────────────────────────┐
│      Quality Gate System         │
└──────────────┬───────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│Coverage│ │  Lint  │ │  Type  │
│  >80%  │ │   0    │ │   0    │
│        │ │ errors │ │ errors │
└───┬────┘ └───┬────┘ └───┬────┘
    │          │          │
    └──────┬───┴────┬─────┘
           │        │
           ▼        ▼
        ┌─────────────┐
        │  All Pass?  │
        └──────┬──────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
     ✅ PASS       ❌ FAIL
    [Deploy]      [Block]
```

---

## Conclusion

Testing MCP applications requires a comprehensive strategy that addresses protocol-specific concerns while maintaining traditional software quality practices. Key takeaways:

**Multi-layer Testing**: Use the testing pyramid to balance unit, integration, and E2E tests effectively.

**Protocol Compliance**: Validate adherence to MCP specification through integration tests.

**Transport Independence**: Test logic separately from transport implementation using mocks.

**Streaming Validation**: Handle asynchronous data flows and progressive results correctly.

**Automation First**: Integrate tests into CI/CD pipelines with clear quality gates.

**Production Readiness**: Include health checks, smoke tests, and monitoring in your test strategy.

By following these patterns and examples, you can build robust, reliable MCP applications that meet production quality standards while maintaining rapid development velocity.

---

## Additional Resources

**MCP SDK Documentation**:
- TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Python SDK: https://github.com/modelcontextprotocol/python-sdk

**Testing Frameworks**:
- Vitest: https://vitest.dev/
- Jest: https://jestjs.io/
- Pytest: https://pytest.org/

**CI/CD Tools**:
- GitHub Actions: https://docs.github.com/en/actions
- GitLab CI: https://docs.gitlab.com/ee/ci/

**Quality Tools**:
- ESLint: https://eslint.org/
- Prettier: https://prettier.io/
- TypeScript: https://www.typescriptlang.org/

---

*This guide is part of the MCP Development Deep Dive series. Continue with "MCP Production Deployment: Scaling and Monitoring Strategies" for deployment best practices.*
