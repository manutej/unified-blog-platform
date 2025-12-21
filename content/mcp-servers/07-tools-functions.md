---
title: "MCP Tools: Building Interactive Functions"
subtitle: "A comprehensive guide"
difficulty: "Intermediate"
readingTime: 25
handsOnTime: 0
learningObjectives: []
prerequisites: []
tags:
  - "mcp-servers"
  - "llm"
  - "ai"
  - "workflow"
publishedDate: "2025-12-08"
---

# MCP Tools: Building Interactive Functions

**Target Audience**: L2-L3 developers
**Prerequisites**: Understanding of MCP foundations, proficiency in TypeScript or Python, experience with async patterns

## Table of Contents

1. [Introduction: Tools as the Interface Layer](#introduction)
2. [Tool Architecture and Lifecycle](#tool-architecture)
3. [Parameter Validation Patterns](#parameter-validation)
4. [Async Operations and Execution Models](#async-operations)
5. [Error Handling Strategies](#error-handling)
6. [Interactive Elicitation](#interactive-elicitation)
7. [Tool Orchestration Patterns](#tool-orchestration)
8. [Structured Output and Type Safety](#structured-output)
9. [Task-Based Execution](#task-based-execution)
10. [Production Patterns](#production-patterns)
11. [Real-World Examples](#real-world-examples)
12. [Best Practices](#best-practices)


## Introduction: Tools as the Interface Layer {#introduction}

In the Model Context Protocol, **tools** are the primary interface through which LLMs can perform actions on behalf of users. Unlike resources (which provide data) or prompts (which provide templates), tools are executable functions that transform inputs into outputs, interact with external systems, and orchestrate complex workflows.

### Why Tools Matter

Tools bridge the gap between LLM reasoning and real-world action. A well-designed tool:

- **Validates inputs** before execution to prevent errors
- **Handles async operations** gracefully for long-running tasks
- **Provides structured output** for reliable parsing
- **Recovers from errors** with meaningful diagnostics
- **Elicits additional input** when needed for interactive workflows
- **Orchestrates complex operations** across multiple steps

### The Challenge

Building production-grade tools requires mastering:

1. **Parameter schemas** - Defining clear, type-safe interfaces
2. **Execution models** - Choosing between sync, async, and task-based patterns
3. **Error boundaries** - Handling failures at multiple levels
4. **State management** - Coordinating multi-step interactions
5. **Performance** - Optimizing for latency and throughput

This guide provides comprehensive patterns for building robust, production-ready MCP tools.


## Tool Architecture and Lifecycle {#tool-architecture}

### Tool Anatomy

Every MCP tool consists of four essential components:

```
┌─────────────────────────────────────────────────┐
│                  MCP Tool                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. METADATA                                     │
│     - name: Unique identifier                    │
│     - title: Human-readable display name         │
│     - description: What the tool does            │
│                                                  │
│  2. INPUT SCHEMA (JSON Schema)                   │
│     - Type definitions                           │
│     - Validation rules                           │
│     - Required fields                            │
│                                                  │
│  3. OUTPUT SCHEMA (Optional)                     │
│     - Expected return structure                  │
│     - Type guarantees                            │
│                                                  │
│  4. HANDLER FUNCTION                             │
│     - Execution logic                            │
│     - Error handling                             │
│     - Return formatting                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Tool Lifecycle

Tools progress through a well-defined lifecycle:

```
REGISTRATION → DISCOVERY → INVOCATION → EXECUTION → RESPONSE
     │              │            │            │           │
     │              │            │            │           │
     v              v            v            v           v
 Define tool    Client      Validate    Run handler  Format
 with schema    lists       parameters   function    output
                tools
```

### Registration Patterns

**TypeScript - High-Level API**:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod';

const server = new McpServer({
    name: 'calculator-server',
    version: '1.0.0'
});

// Register a tool with input and output schemas
server.registerTool(
    'add',
    {
        title: 'Addition Tool',
        description: 'Add two numbers together',
        inputSchema: {
            a: z.number().describe('First number'),
            b: z.number().describe('Second number')
        },
        outputSchema: {
            result: z.number(),
            operation: z.string()
        }
    },
    async ({ a, b }) => {
        const output = { result: a + b, operation: 'addition' };
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }]
        };
    }
);
```
*Source: [TypeScript SDK - Basic Tool Registration](https://context7.com/modelcontextprotocol/typescript-sdk/llms.txt)*

**Python - FastMCP API**:

```python
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field

mcp = FastMCP("Calculator Service")

class CalculationResult(BaseModel):
    """Structured calculation result."""
    result: float = Field(description="Calculation result")
    operation: str = Field(description="Operation performed")

@mcp.tool()
def add(a: float, b: float) -> CalculationResult:
    """Add two numbers together."""
    return CalculationResult(
        result=a + b,
        operation="addition"
    )
```
*Source: [Python SDK - Structured Output](https://context7.com/modelcontextprotocol/python-sdk/llms.txt)*

### Tool Discovery Protocol

Clients discover tools via the `tools/list` request:

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "cursor": "optional-cursor-value"
  }
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "add",
        "title": "Addition Tool",
        "description": "Add two numbers together",
        "inputSchema": {
          "type": "object",
          "properties": {
            "a": { "type": "number", "description": "First number" },
            "b": { "type": "number", "description": "Second number" }
          },
          "required": ["a", "b"]
        },
        "outputSchema": {
          "type": "object",
          "properties": {
            "result": { "type": "number" },
            "operation": { "type": "string" }
          }
        }
      }
    ],
    "nextCursor": "next-page-cursor"
  }
}
```
*Source: [MCP Specification - Tools Protocol](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)*


## Parameter Validation Patterns {#parameter-validation}

Robust parameter validation prevents runtime errors and provides clear feedback to LLMs.

### Schema-Based Validation

**TypeScript with Zod**:

```typescript
import * as z from 'zod';

server.registerTool(
    'calculate-bmi',
    {
        title: 'BMI Calculator',
        description: 'Calculate Body Mass Index',
        inputSchema: {
            weightKg: z.number().positive().describe('Weight in kilograms'),
            heightM: z.number().positive().max(3).describe('Height in meters')
        },
        outputSchema: {
            bmi: z.number(),
            category: z.enum(['underweight', 'normal', 'overweight', 'obese'])
        }
    },
    async ({ weightKg, heightM }) => {
        // Schema automatically validates:
        // - weightKg and heightM are numbers
        // - Both are positive
        // - heightM is ≤ 3 meters

        const bmi = weightKg / (heightM * heightM);

        let category: 'underweight' | 'normal' | 'overweight' | 'obese';
        if (bmi < 18.5) category = 'underweight';
        else if (bmi < 25) category = 'normal';
        else if (bmi < 30) category = 'overweight';
        else category = 'obese';

        const output = { bmi: Math.round(bmi * 10) / 10, category };
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }]
        };
    }
);
```
*Source: [TypeScript SDK - Tool Registration with Validation](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md)*

**Python with Pydantic**:

```python
from pydantic import BaseModel, Field, field_validator
from typing import Literal

class BMIInput(BaseModel):
    """BMI calculation input."""
    weight_kg: float = Field(gt=0, description="Weight in kilograms")
    height_m: float = Field(gt=0, le=3, description="Height in meters")

    @field_validator('height_m')
    @classmethod
    def validate_height(cls, v: float) -> float:
        if v < 0.5:
            raise ValueError("Height must be at least 0.5 meters")
        return v

class BMIOutput(BaseModel):
    """BMI calculation result."""
    bmi: float
    category: Literal['underweight', 'normal', 'overweight', 'obese']

@mcp.tool()
def calculate_bmi(
    weight_kg: float,
    height_m: float
) -> BMIOutput:
    """Calculate BMI with validated inputs."""
    # Pydantic validates automatically
    bmi = weight_kg / (height_m ** 2)

    if bmi < 18.5:
        category = 'underweight'
    elif bmi < 25:
        category = 'normal'
    elif bmi < 30:
        category = 'overweight'
    else:
        category = 'obese'

    return BMIOutput(
        bmi=round(bmi, 1),
        category=category
    )
```
*Source: [Python SDK - Pydantic Validation](https://context7.com/modelcontextprotocol/python-sdk/llms.txt)*

### Complex Validation Scenarios

**Conditional validation**:

```typescript
server.registerTool(
    'schedule-meeting',
    {
        title: 'Schedule Meeting',
        description: 'Schedule a meeting with conditional validation',
        inputSchema: {
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            startTime: z.string().regex(/^\d{2}:\d{2}$/),
            duration: z.number().min(15).max(480), // 15 min to 8 hours
            attendees: z.array(z.string().email()).min(1).max(50),
            isRecurring: z.boolean().optional(),
            recurrenceRule: z.string().optional()
        }
    },
    async (params) => {
        // Custom conditional validation
        if (params.isRecurring && !params.recurrenceRule) {
            throw new Error('recurrenceRule required when isRecurring is true');
        }

        // Validate business hours
        const [hours, minutes] = params.startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;

        if (startMinutes < 9 * 60 || startMinutes > 17 * 60) {
            throw new Error('Meetings must be scheduled between 9 AM and 5 PM');
        }

        // Process meeting...
        return {
            content: [{
                type: 'text',
                text: `Meeting scheduled for ${params.date} at ${params.startTime}`
            }]
        };
    }
);
```


## Async Operations and Execution Models {#async-operations}

MCP tools support multiple execution models for different use cases.

### Synchronous Tools

Best for fast operations (<1 second):

```python
@mcp.tool()
def convert_temperature(celsius: float) -> dict[str, float]:
    """Convert Celsius to Fahrenheit instantly."""
    fahrenheit = (celsius * 9/5) + 32
    return {"celsius": celsius, "fahrenheit": fahrenheit}
```

### Asynchronous Tools

For I/O-bound operations:

```python
import aiohttp
from mcp.server.fastmcp import Context, FastMCP
from mcp.server.session import ServerSession

mcp = FastMCP("Weather Service")

@mcp.tool()
async def fetch_weather(
    city: str,
    ctx: Context[ServerSession, None]
) -> dict[str, any]:
    """Fetch weather data asynchronously."""

    await ctx.info(f"Fetching weather for {city}...")

    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"https://api.weather.com/v1/current?city={city}"
        ) as response:
            data = await response.json()

    return {
        "city": city,
        "temperature": data["temp"],
        "condition": data["condition"]
    }
```
*Source: [Python SDK - Async Tool Pattern](https://github.com/modelcontextprotocol/python-sdk/blob/main/README.md)*

### Progress Reporting

For long-running operations:

```python
@mcp.tool()
async def process_large_file(
    file_path: str,
    ctx: Context[ServerSession, None],
    chunk_size: int = 1000
) -> str:
    """Process large file with progress updates."""

    await ctx.info(f"Starting processing: {file_path}")

    total_lines = sum(1 for _ in open(file_path))
    processed = 0

    with open(file_path) as f:
        while True:
            chunk = list(itertools.islice(f, chunk_size))
            if not chunk:
                break

            # Process chunk
            await process_chunk(chunk)

            processed += len(chunk)
            progress = processed / total_lines

            await ctx.report_progress(
                progress=progress,
                total=1.0,
                message=f"Processed {processed}/{total_lines} lines"
            )

            await ctx.debug(f"Completed chunk {processed//chunk_size}")

    return f"Processed {total_lines} lines successfully"
```
*Source: [Python SDK - Progress Updates](https://github.com/modelcontextprotocol/python-sdk/blob/main/README.md)*

### Task-Based Execution

For operations requiring user interaction or extended execution:

```python
from mcp.server import Server
from mcp.server.experimental.task_context import ServerTaskContext
from mcp.types import CallToolResult, CreateTaskResult, TextContent, TASK_REQUIRED

server = Server("task-demo")
server.experimental.enable_tasks()

async def handle_long_analysis(arguments: dict) -> CreateTaskResult:
    """Run analysis as a task with status updates."""
    ctx = server.request_context
    ctx.experimental.validate_task_mode(TASK_REQUIRED)

    dataset = arguments.get("dataset", "")

    async def work(task: ServerTaskContext) -> CallToolResult:
        await task.update_status("Loading dataset...")
        data = await load_dataset(dataset)

        await task.update_status("Running analysis...")
        results = await analyze_data(data)

        await task.update_status("Generating report...")
        report = await generate_report(results)

        return CallToolResult(
            content=[TextContent(type="text", text=report)]
        )

    return await ctx.experimental.run_task(work)
```
*Source: [Python SDK - Task Support](https://github.com/modelcontextprotocol/python-sdk/blob/main/docs/experimental/tasks-server.md)*


## Error Handling Strategies {#error-handling}

Robust error handling is critical for production tools.

### Error Hierarchy

```
┌────────────────────────────────────────────┐
│          Error Handling Layers             │
├────────────────────────────────────────────┤
│                                            │
│  1. VALIDATION ERRORS                      │
│     → Invalid input schema                 │
│     → Type mismatches                      │
│     → Constraint violations                │
│                                            │
│  2. EXECUTION ERRORS                       │
│     → Network failures                     │
│     → Timeouts                             │
│     → Resource unavailable                 │
│                                            │
│  3. BUSINESS LOGIC ERRORS                  │
│     → Insufficient permissions             │
│     → Data conflicts                       │
│     → Precondition failures                │
│                                            │
│  4. SYSTEM ERRORS                          │
│     → Out of memory                        │
│     → Disk full                            │
│     → Unexpected exceptions                │
│                                            │
└────────────────────────────────────────────┘
```

### Granular Error Handling

**Python Pattern**:

```python
from mcp.shared.exceptions import McpError

@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """Handle tool calls with comprehensive error handling."""

    try:
        if name == "get_weather":
            city = arguments.get("city")

            if not city:
                raise ValueError("city parameter is required")

            # Simulated weather API call
            weather_data = await fetch_weather_data(city)

            return {
                "temperature": weather_data["temp"],
                "condition": weather_data["condition"],
                "humidity": weather_data["humidity"],
                "city": city
            }
        else:
            raise ValueError(f"Unknown tool: {name}")

    except ValueError as e:
        # Input validation errors
        raise ValueError(f"Invalid input: {str(e)}")

    except ConnectionError as e:
        # Network errors
        raise RuntimeError(f"Weather service unavailable: {str(e)}")

    except TimeoutError:
        # Timeout errors
        raise RuntimeError("Weather service request timed out")

    except Exception as e:
        # Unexpected errors
        raise RuntimeError(f"Unexpected error: {str(e)}")
```
*Source: [Python SDK - Error Handling](https://github.com/modelcontextprotocol/python-sdk/blob/main/README.md)*

### Task Error Handling

```python
async def work(task: ServerTaskContext) -> CallToolResult:
    """Execute work with explicit error handling."""
    try:
        await task.update_status("Starting operation...")
        result = await risky_operation()

        return CallToolResult(
            content=[TextContent(type="text", text=result)]
        )

    except PermissionError as e:
        await task.fail("Access denied - insufficient permissions")
        raise

    except TimeoutError as e:
        await task.fail("Operation timed out after 30 seconds")
        raise

    except Exception as e:
        await task.fail(f"Unexpected error: {str(e)}")
        raise
```
*Source: [Python SDK - Task Error Handling](https://github.com/modelcontextprotocol/python-sdk/blob/main/docs/experimental/tasks-server.md)*

### Client-Side Error Recovery

**TypeScript Pattern**:

```typescript
async function callToolWithRetry(
    session: ClientSession,
    name: string,
    arguments: any,
    maxRetries: number = 3
): Promise<CallToolResult> {

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await session.callTool({ name, arguments });
            return result;

        } catch (error) {
            lastError = error as Error;

            // Don't retry validation errors
            if (error.message.includes("Invalid input")) {
                throw error;
            }

            // Exponential backoff
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(`Tool call failed after ${maxRetries} attempts: ${lastError?.message}`);
}
```


## Interactive Elicitation {#interactive-elicitation}

Elicitation enables tools to request additional user input during execution.

### Basic Elicitation Pattern

**Python**:

```python
from pydantic import BaseModel, Field
from mcp.server.fastmcp import Context, FastMCP
from mcp.server.session import ServerSession

mcp = FastMCP("Booking Service")

class BookingPreferences(BaseModel):
    """User preferences for alternative booking."""
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
    ctx: Context[ServerSession, None]
) -> str:
    """Book a table with date availability checking."""

    # Check availability
    if date == "2024-12-25":
        # Request user input when date unavailable
        result = await ctx.elicit(
            message=f"No tables available for {party_size} on {date}. Try another date?",
            schema=BookingPreferences
        )

        # Handle user response
        if result.action == "accept" and result.data:
            if result.data.checkAlternative:
                new_date = result.data.alternativeDate
                return f"[SUCCESS] Booked for {new_date} at {time}"
            return "[CANCELLED] No booking made"

        return "[CANCELLED] Booking cancelled"

    # Date available
    return f"[SUCCESS] Booked for {date} at {time} for {party_size} people"
```
*Source: [Python SDK - User Elicitation](https://context7.com/modelcontextprotocol/python-sdk/llms.txt)*

**TypeScript**:

```typescript
server.registerTool(
    'book-restaurant',
    {
        title: 'Book Restaurant',
        description: 'Make a restaurant reservation',
        inputSchema: {
            restaurant: z.string(),
            date: z.string(),
            partySize: z.number()
        },
        outputSchema: {
            success: z.boolean(),
            booking: z.object({
                restaurant: z.string(),
                date: z.string(),
                confirmationCode: z.string()
            }).optional(),
            alternatives: z.array(z.string()).optional()
        }
    },
    async ({ restaurant, date, partySize }) => {
        const available = await checkAvailability(restaurant, date, partySize);

        if (!available) {
            // Ask user for alternatives
            const result = await server.server.elicitInput({
                message: `No tables available at ${restaurant} on ${date}. Check alternative dates?`,
                requestedSchema: {
                    type: 'object',
                    properties: {
                        checkAlternatives: {
                            type: 'boolean',
                            title: 'Check alternative dates',
                            description: 'Would you like to check other dates?'
                        },
                        flexibility: {
                            type: 'string',
                            title: 'Date flexibility',
                            enum: ['next_day', 'same_week', 'next_week'],
                            enumNames: ['Next day only', 'Same week', 'Next week']
                        }
                    },
                    required: ['checkAlternatives']
                }
            });

            if (result.action === 'accept' && result.content?.checkAlternatives) {
                const alternatives = await findAlternatives(
                    restaurant,
                    date,
                    result.content.flexibility
                );

                const output = { success: false, alternatives };
                return {
                    content: [{ type: 'text', text: JSON.stringify(output) }]
                };
            }

            const output = { success: false };
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }]
            };
        }

        const booking = await createBooking(restaurant, date, partySize);
        const output = { success: true, booking };

        return {
            content: [{ type: 'text', text: JSON.stringify(output) }]
        };
    }
);
```
*Source: [TypeScript SDK - Elicitation](https://context7.com/modelcontextprotocol/typescript-sdk/llms.txt)*

### Multi-Step Elicitation

```python
async def handle_confirm_action(arguments: dict) -> CreateTaskResult:
    """Multi-step confirmation workflow."""
    ctx = server.request_context
    ctx.experimental.validate_task_mode(TASK_REQUIRED)

    action = arguments.get("action", "unknown action")

    async def work(task: ServerTaskContext) -> CallToolResult:
        # Step 1: Initial confirmation
        result = await task.elicit(
            message=f"Confirm: {action}?",
            requestedSchema={
                "type": "object",
                "properties": {"confirm": {"type": "boolean"}},
                "required": ["confirm"]
            }
        )

        if result.action != "accept" or not result.content.get("confirm"):
            return CallToolResult(
                content=[TextContent(type="text", text="Cancelled by user")]
            )

        # Step 2: Request additional details
        details = await task.elicit(
            message="Please provide execution details:",
            requestedSchema={
                "type": "object",
                "properties": {
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high"]
                    },
                    "notify": {"type": "boolean"}
                },
                "required": ["priority"]
            }
        )

        if details.action == "accept":
            # Execute with details
            result_text = f"Executed: {action} (priority: {details.content['priority']})"
            return CallToolResult(
                content=[TextContent(type="text", text=result_text)]
            )

        return CallToolResult(
            content=[TextContent(type="text", text="Cancelled")]
        )

    return await ctx.experimental.run_task(work)
```
*Source: [Python SDK - Task Elicitation](https://github.com/modelcontextprotocol/python-sdk/blob/main/docs/experimental/tasks-server.md)*


## Tool Orchestration Patterns {#tool-orchestration}

Complex workflows often require coordinating multiple tools.

### Sequential Orchestration

```typescript
class WorkflowOrchestrator {
    constructor(private session: ClientSession) {}

    async executeWorkflow(workflow: WorkflowDefinition): Promise<any> {
        const results: Map<string, any> = new Map();

        for (const step of workflow.steps) {
            console.log(`Executing step: ${step.name}`);

            // Resolve dependencies
            const args = this.resolveDependencies(step.arguments, results);

            // Execute tool
            const result = await this.session.callTool({
                name: step.tool,
                arguments: args
            });

            // Store result
            results.set(step.name, result);

            // Check conditions
            if (step.condition && !this.evaluateCondition(step.condition, results)) {
                throw new Error(`Condition failed for step: ${step.name}`);
            }
        }

        return results.get(workflow.outputStep);
    }

    private resolveDependencies(
        args: Record<string, any>,
        results: Map<string, any>
    ): Record<string, any> {
        const resolved: Record<string, any> = {};

        for (const [key, value] of Object.entries(args)) {
            if (typeof value === 'string' && value.startsWith('$')) {
                // Dependency reference: $stepName.field
                const [stepName, field] = value.slice(1).split('.');
                resolved[key] = field
                    ? results.get(stepName)?.[field]
                    : results.get(stepName);
            } else {
                resolved[key] = value;
            }
        }

        return resolved;
    }
}

// Usage
const workflow = {
    steps: [
        {
            name: 'fetch_user',
            tool: 'get_user',
            arguments: { userId: '123' }
        },
        {
            name: 'fetch_orders',
            tool: 'get_orders',
            arguments: { userId: '$fetch_user.id' }
        },
        {
            name: 'calculate_total',
            tool: 'sum_orders',
            arguments: { orders: '$fetch_orders' }
        }
    ],
    outputStep: 'calculate_total'
};

const orchestrator = new WorkflowOrchestrator(session);
const result = await orchestrator.executeWorkflow(workflow);
```

### Parallel Orchestration

```python
import asyncio
from typing import List, Dict, Any

class ParallelToolExecutor:
    """Execute multiple tools in parallel."""

    def __init__(self, session):
        self.session = session

    async def execute_parallel(
        self,
        tool_calls: List[Dict[str, Any]],
        max_concurrency: int = 5
    ) -> List[Any]:
        """Execute tools with concurrency limit."""

        semaphore = asyncio.Semaphore(max_concurrency)

        async def execute_with_semaphore(call: Dict[str, Any]) -> Any:
            async with semaphore:
                return await self.session.call_tool(
                    name=call["name"],
                    arguments=call["arguments"]
                )

        tasks = [
            execute_with_semaphore(call)
            for call in tool_calls
        ]

        return await asyncio.gather(*tasks, return_exceptions=True)

# Usage
executor = ParallelToolExecutor(session)

calls = [
    {"name": "fetch_weather", "arguments": {"city": "London"}},
    {"name": "fetch_weather", "arguments": {"city": "Paris"}},
    {"name": "fetch_weather", "arguments": {"city": "Tokyo"}},
]

results = await executor.execute_parallel(calls, max_concurrency=3)

for city_call, result in zip(calls, results):
    city = city_call["arguments"]["city"]
    if isinstance(result, Exception):
        print(f"{city}: Error - {result}")
    else:
        print(f"{city}: {result['temperature']}°C")
```

### Dynamic Tool Discovery

```typescript
server.registerTool(
    'upgrade-permissions',
    {
        title: 'Upgrade Permissions',
        description: 'Upgrade to write access',
        inputSchema: { level: z.enum(['write', 'admin']) },
        outputSchema: { success: z.boolean(), newLevel: z.string() }
    },
    async ({ level }) => {
        // Dynamically enable tools based on permission level
        if (level === 'write') {
            writeTool.enable();
        }

        if (level === 'admin') {
            writeTool.enable();
            deleteTool.enable();

            // Remove upgrade tool once admin level reached
            upgradeTool.remove();
        }

        const output = { success: true, newLevel: level };
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }]
        };
    }
);
```
*Source: [TypeScript SDK - Dynamic Tool Management](https://context7.com/modelcontextprotocol/typescript-sdk/llms.txt)*


## Structured Output and Type Safety {#structured-output}

Structured output ensures reliable parsing and type safety.

### Python Structured Output

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Data Service")

class WeatherData(BaseModel):
    """Rich weather information structure."""
    temperature: float = Field(description="Temperature in Celsius")
    humidity: float = Field(description="Humidity percentage")
    condition: str
    wind_speed: float
    forecast: Optional[List[str]] = None

@mcp.tool()
def get_weather(city: str) -> WeatherData:
    """Get weather for a city - returns structured data."""
    # Pydantic validates output structure
    return WeatherData(
        temperature=22.5,
        humidity=45.0,
        condition="sunny",
        wind_speed=5.2,
        forecast=["Sunny tomorrow", "Rain on Thursday"]
    )

class LocationInfo(BaseModel):
    """Location coordinates."""
    latitude: float
    longitude: float
    name: str

@mcp.tool()
def get_location(address: str) -> LocationInfo:
    """Get location coordinates with structured output."""
    return LocationInfo(
        latitude=51.5074,
        longitude=-0.1278,
        name="London, UK"
    )

# Primitive types are automatically wrapped
@mcp.tool()
def get_temperature(city: str) -> float:
    """Returns temperature as a simple float."""
    return 22.5  # Returns: {"result": 22.5}

# Lists are wrapped automatically
@mcp.tool()
def list_cities() -> List[str]:
    """Get a list of cities."""
    return ["London", "Paris", "Tokyo"]
    # Returns: {"result": ["London", "Paris", "Tokyo"]}
```
*Source: [Python SDK - Structured Output Patterns](https://github.com/modelcontextprotocol/python-sdk/blob/main/README.md)*

### TypeScript Structured Output

```typescript
server.registerTool(
    'analyze-sentiment',
    {
        title: 'Sentiment Analysis',
        description: 'Analyze text sentiment',
        inputSchema: {
            text: z.string().min(1).max(5000)
        },
        outputSchema: {
            sentiment: z.enum(['positive', 'negative', 'neutral']),
            confidence: z.number().min(0).max(1),
            keywords: z.array(z.string()),
            scores: z.object({
                positive: z.number(),
                negative: z.number(),
                neutral: z.number()
            })
        }
    },
    async ({ text }) => {
        const analysis = await analyzeSentiment(text);

        const output = {
            sentiment: analysis.primary,
            confidence: analysis.confidence,
            keywords: analysis.keywords,
            scores: {
                positive: analysis.scores.positive,
                negative: analysis.scores.negative,
                neutral: analysis.scores.neutral
            }
        };

        // Type-safe structured output
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }]
        };
    }
);
```


## Task-Based Execution {#task-based-execution}

Tasks enable long-running operations with status updates and user interaction.

### Task Declaration

```python
from mcp.types import Tool, ToolExecution, TASK_REQUIRED, TASK_OPTIONAL, TASK_FORBIDDEN

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="quick_calculation",
            description="Fast calculation (sync)",
            inputSchema={"type": "object", "properties": {"x": {"type": "number"}}},
            execution=ToolExecution(taskSupport=TASK_FORBIDDEN)
        ),
        Tool(
            name="data_analysis",
            description="Optional task-based analysis",
            inputSchema={"type": "object", "properties": {"dataset": {"type": "string"}}},
            execution=ToolExecution(taskSupport=TASK_OPTIONAL)
        ),
        Tool(
            name="user_confirmation",
            description="Requires user interaction (task)",
            inputSchema={"type": "object", "properties": {"action": {"type": "string"}}},
            execution=ToolExecution(taskSupport=TASK_REQUIRED)
        )
    ]
```
*Source: [Python SDK - Task Support Levels](https://github.com/modelcontextprotocol/python-sdk/blob/main/docs/experimental/tasks-server.md)*

### Task Implementation

```python
@server.call_tool()
async def handle_tool(name: str, arguments: dict):
    ctx = server.request_context

    if name == "data_analysis":
        # Check if running as task
        if ctx.experimental.is_task:
            return await run_as_task(arguments)
        else:
            # Run synchronously if not task mode
            return await run_sync(arguments)

    elif name == "user_confirmation":
        # Must run as task
        ctx.experimental.validate_task_mode(TASK_REQUIRED)
        return await run_confirmation_task(arguments)

async def run_as_task(arguments: dict) -> CreateTaskResult:
    """Run analysis with progress updates."""
    ctx = server.request_context

    async def work(task: ServerTaskContext) -> CallToolResult:
        dataset = arguments.get("dataset")

        await task.update_status("Loading data...")
        data = await load_data(dataset)

        await task.update_status("Preprocessing...")
        processed = await preprocess(data)

        await task.update_status("Running analysis...")
        results = await analyze(processed)

        await task.update_status("Generating report...")
        report = await generate_report(results)

        return CallToolResult(
            content=[TextContent(type="text", text=report)]
        )

    return await ctx.experimental.run_task(work)
```
*Source: [Python SDK - Task Implementation](https://github.com/modelcontextprotocol/python-sdk/blob/main/docs/experimental/tasks-server.md)*

### Handling Task Results

```python
from mcp.shared.exceptions import McpError

try:
    # Call tool as task
    result = await session.experimental.call_tool_as_task("data_analysis", {
        "dataset": "sales_2024"
    })

    task_id = result.task.taskId

    # Poll for status
    async for status in session.experimental.poll_task(task_id):
        print(f"Status: {status.status} - {status.statusMessage}")

        if status.status == "input_required":
            # Handle elicitation
            final = await session.experimental.get_task_result(task_id, CallToolResult)
            break

        elif status.status == "completed":
            final = await session.experimental.get_task_result(task_id, CallToolResult)
            for content in final.content:
                if hasattr(content, "text"):
                    print(content.text)
            break

        elif status.status == "failed":
            print(f"Task failed: {status.statusMessage}")
            break

        elif status.status == "cancelled":
            print("Task was cancelled")
            break

except McpError as e:
    print(f"MCP error: {e.error.message}")
except Exception as e:
    print(f"Error: {e}")
```
*Source: [Python SDK - Task Result Handling](https://github.com/modelcontextprotocol/python-sdk/blob/main/docs/experimental/tasks-client.md)*


## Production Patterns {#production-patterns}

### Rate Limiting

```typescript
class RateLimitedToolServer {
    private callCounts: Map<string, number[]> = new Map();

    constructor(
        private server: McpServer,
        private limits: Map<string, { calls: number; window: number }>
    ) {}

    async callTool(
        toolName: string,
        arguments: any,
        clientId: string
    ): Promise<any> {
        // Check rate limit
        if (this.isRateLimited(toolName, clientId)) {
            throw new Error(`Rate limit exceeded for ${toolName}`);
        }

        // Record call
        this.recordCall(toolName, clientId);

        // Execute tool
        return await this.server.callTool(toolName, arguments);
    }

    private isRateLimited(toolName: string, clientId: string): boolean {
        const key = `${toolName}:${clientId}`;
        const limit = this.limits.get(toolName);

        if (!limit) return false;

        const now = Date.now();
        const windowStart = now - limit.window;

        const calls = this.callCounts.get(key) || [];
        const recentCalls = calls.filter(t => t > windowStart);

        return recentCalls.length >= limit.calls;
    }

    private recordCall(toolName: string, clientId: string): void {
        const key = `${toolName}:${clientId}`;
        const calls = this.callCounts.get(key) || [];
        calls.push(Date.now());
        this.callCounts.set(key, calls);
    }
}
```

### Caching

```python
from functools import lru_cache
import hashlib
import json

class CachedToolExecutor:
    """Tool executor with result caching."""

    def __init__(self, cache_size: int = 100):
        self.cache: Dict[str, Any] = {}
        self.cache_size = cache_size

    def cache_key(self, tool_name: str, arguments: dict) -> str:
        """Generate cache key from tool call."""
        data = json.dumps({"tool": tool_name, "args": arguments}, sort_keys=True)
        return hashlib.sha256(data.encode()).hexdigest()

    async def execute(
        self,
        session,
        tool_name: str,
        arguments: dict,
        cacheable: bool = True
    ) -> Any:
        """Execute tool with optional caching."""

        if cacheable:
            key = self.cache_key(tool_name, arguments)

            # Check cache
            if key in self.cache:
                return self.cache[key]

        # Execute tool
        result = await session.call_tool(
            name=tool_name,
            arguments=arguments
        )

        # Cache result
        if cacheable:
            self.cache[key] = result

            # Evict oldest if cache full
            if len(self.cache) > self.cache_size:
                oldest_key = next(iter(self.cache))
                del self.cache[oldest_key]

        return result
```

### Monitoring and Observability

```typescript
class InstrumentedToolServer {
    private metrics = {
        calls: new Map<string, number>(),
        errors: new Map<string, number>(),
        latencies: new Map<string, number[]>()
    };

    constructor(private server: McpServer) {
        this.setupInstrumentation();
    }

    private setupInstrumentation(): void {
        const originalRegister = this.server.registerTool.bind(this.server);

        this.server.registerTool = ((name, config, handler) => {
            const instrumentedHandler = async (args: any, extra: any) => {
                const startTime = Date.now();

                try {
                    // Increment call counter
                    this.incrementMetric('calls', name);

                    // Execute handler
                    const result = await handler(args, extra);

                    // Record latency
                    const latency = Date.now() - startTime;
                    this.recordLatency(name, latency);

                    return result;

                } catch (error) {
                    // Increment error counter
                    this.incrementMetric('errors', name);

                    // Log error with context
                    console.error(`Tool error [${name}]:`, {
                        error: error.message,
                        arguments: args,
                        timestamp: new Date().toISOString()
                    });

                    throw error;
                }
            };

            return originalRegister(name, config, instrumentedHandler);
        }) as any;
    }

    private incrementMetric(metric: string, tool: string): void {
        const map = this.metrics[metric];
        map.set(tool, (map.get(tool) || 0) + 1);
    }

    private recordLatency(tool: string, latency: number): void {
        const latencies = this.metrics.latencies.get(tool) || [];
        latencies.push(latency);

        // Keep last 100 latencies
        if (latencies.length > 100) {
            latencies.shift();
        }

        this.metrics.latencies.set(tool, latencies);
    }

    getMetrics(): any {
        return {
            calls: Object.fromEntries(this.metrics.calls),
            errors: Object.fromEntries(this.metrics.errors),
            latencies: Object.fromEntries(
                Array.from(this.metrics.latencies.entries()).map(([tool, lats]) => [
                    tool,
                    {
                        p50: this.percentile(lats, 0.5),
                        p95: this.percentile(lats, 0.95),
                        p99: this.percentile(lats, 0.99)
                    }
                ])
            )
        };
    }

    private percentile(values: number[], p: number): number {
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[index];
    }
}
```


## Real-World Examples {#real-world-examples}

### Weather Service with LLM Integration

```typescript
server.registerTool(
    'summarize-weather',
    {
        title: 'Weather Summary with AI',
        description: 'Get AI-generated weather summary',
        inputSchema: {
            city: z.string(),
            days: z.number().min(1).max(7).default(3)
        },
        outputSchema: {
            summary: z.string(),
            details: z.object({
                city: z.string(),
                currentTemp: z.number(),
                forecast: z.array(z.string())
            })
        }
    },
    async ({ city, days }) => {
        // Fetch weather data
        const weatherData = await fetchWeatherForecast(city, days);

        // Use LLM sampling to generate summary
        const response = await server.server.createMessage({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Summarize this ${days}-day weather forecast for ${city} in one paragraph:\n\n${JSON.stringify(weatherData)}`
                }
            }],
            maxTokens: 200
        });

        const summary = response.content.type === 'text'
            ? response.content.text
            : 'Unable to generate summary';

        const output = {
            summary,
            details: {
                city: weatherData.city,
                currentTemp: weatherData.current.temperature,
                forecast: weatherData.forecast.map(d => `${d.date}: ${d.condition}`)
            }
        };

        return {
            content: [{ type: 'text', text: JSON.stringify(output) }]
        };
    }
);
```
*Source: [TypeScript SDK - LLM Sampling in Tools](https://context7.com/modelcontextprotocol/typescript-sdk/llms.txt)*

### File Processing with Progress

```python
import asyncio
from pathlib import Path

@mcp.tool()
async def batch_convert_images(
    directory: str,
    format: str,
    ctx: Context[ServerSession, None]
) -> dict:
    """Convert all images in directory with progress updates."""

    path = Path(directory)
    image_files = list(path.glob("*.jpg")) + list(path.glob("*.png"))
    total = len(image_files)

    await ctx.info(f"Found {total} images to convert")

    converted = 0
    errors = []

    for i, image_file in enumerate(image_files):
        try:
            await ctx.report_progress(
                progress=(i + 1) / total,
                total=1.0,
                message=f"Converting {image_file.name}"
            )

            await convert_image(image_file, format)
            converted += 1

        except Exception as e:
            errors.append(f"{image_file.name}: {str(e)}")
            await ctx.debug(f"Error converting {image_file.name}: {e}")

    return {
        "total": total,
        "converted": converted,
        "errors": errors,
        "success_rate": converted / total if total > 0 else 0
    }
```


## Best Practices {#best-practices}

### Tool Design Principles

1. **Single Responsibility**
   - Each tool should do one thing well
   - Avoid monolithic tools that handle multiple unrelated operations
   - Compose complex workflows from simple tools

2. **Clear Contracts**
   - Use descriptive names and descriptions
   - Define comprehensive input/output schemas
   - Document edge cases and constraints

3. **Graceful Degradation**
   - Provide partial results when possible
   - Return informative errors
   - Support fallback behaviors

4. **Idempotency**
   - Make tools safe to retry
   - Use unique identifiers for operations
   - Document side effects clearly

### Parameter Design

```typescript
// Good: Clear, typed, with defaults
{
    city: z.string().min(1).describe('City name (e.g., "London")'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
    includeForecast: z.boolean().default(true),
    days: z.number().int().min(1).max(14).default(7)
}

// Bad: Unclear, untyped, no validation
{
    location: z.string(),
    temp: z.string(),
    extra: z.any()
}
```

### Error Messages

```python
# Good: Specific, actionable error messages
if not city:
    raise ValueError("city parameter is required and cannot be empty")

if not 1 <= days <= 14:
    raise ValueError(f"days must be between 1 and 14, got {days}")

# Bad: Generic, unhelpful errors
if not city:
    raise ValueError("invalid input")
```

### Documentation

```typescript
server.registerTool(
    'calculate-shipping',
    {
        title: 'Calculate Shipping Cost',
        description: `
            Calculate shipping cost based on weight, distance, and service level.

            Notes:
            - Weight must be in kilograms
            - Distance is calculated automatically from postal codes
            - Express service available for domestic shipments only
            - International shipments have minimum 3-day delivery

            Returns total cost including base rate, distance surcharge, and service fee.
        `,
        inputSchema: {
            weight: z.number().positive().describe('Package weight in kg'),
            fromPostal: z.string().regex(/^\d{5}$/).describe('5-digit origin postal code'),
            toPostal: z.string().regex(/^\d{5}$/).describe('5-digit destination postal code'),
            service: z.enum(['standard', 'express', 'overnight']).describe('Delivery service level')
        },
        outputSchema: {
            totalCost: z.number(),
            breakdown: z.object({
                baseRate: z.number(),
                distanceSurcharge: z.number(),
                serviceFee: z.number()
            }),
            estimatedDays: z.number().int()
        }
    },
    async (params) => {
        // Implementation...
    }
);
```

### Testing

```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_weather_tool_success():
    """Test successful weather fetch."""

    with patch('aiohttp.ClientSession.get') as mock_get:
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "temp": 22.5,
            "condition": "sunny"
        }
        mock_get.return_value.__aenter__.return_value = mock_response

        result = await fetch_weather("London")

        assert result["temperature"] == 22.5
        assert result["condition"] == "sunny"

@pytest.mark.asyncio
async def test_weather_tool_error_handling():
    """Test error handling for network failures."""

    with patch('aiohttp.ClientSession.get', side_effect=ConnectionError):
        with pytest.raises(RuntimeError, match="Weather service unavailable"):
            await fetch_weather("London")

@pytest.mark.asyncio
async def test_weather_tool_validation():
    """Test input validation."""

    with pytest.raises(ValueError, match="city parameter is required"):
        await fetch_weather("")
```


## Conclusion

Building production-grade MCP tools requires attention to:

1. **Clear interfaces** - Well-defined schemas with comprehensive validation
2. **Robust execution** - Async patterns, progress reporting, and task support
3. **Error resilience** - Granular error handling and recovery strategies
4. **User interaction** - Elicitation for dynamic workflows
5. **Orchestration** - Composing simple tools into complex workflows
6. **Type safety** - Structured output for reliable parsing
7. **Production readiness** - Rate limiting, caching, and monitoring

### Key Takeaways

- Tools are the action layer of MCP, bridging LLM reasoning and real-world execution
- Use schema validation (Zod/Pydantic) to catch errors early
- Choose execution models (sync/async/task) based on operation characteristics
- Implement comprehensive error handling at multiple levels
- Leverage elicitation for interactive, multi-step workflows
- Compose tools into workflows for complex operations
- Monitor, cache, and rate-limit for production deployments

### Next Steps

1. **Build a production tool** with full error handling and monitoring
2. **Implement elicitation** for an interactive booking/confirmation workflow
3. **Create a tool orchestrator** that coordinates multiple tools
4. **Add comprehensive tests** including edge cases and error scenarios
5. **Optimize performance** with caching and parallel execution

### Additional Resources

- [MCP Specification - Tools Protocol](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [Python SDK - Tool Documentation](https://github.com/modelcontextprotocol/python-sdk)
- [TypeScript SDK - Tool Examples](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Community Discussions](https://github.com/modelcontextprotocol/specification/discussions)


**Written**: December 11, 2025

**Acknowledgments**: Anthropic MCP team, Python SDK maintainers, TypeScript SDK maintainers, MCP open-source community
