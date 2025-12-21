---
title: "Cross-Platform Portability - Building Vendor-Agnostic Context Systems"
subtitle: "A comprehensive guide"
difficulty: "Intermediate"
readingTime: 35
handsOnTime: 0
learningObjectives: []
prerequisites:
  - "Understanding of RESTful API design principles"
  - "Familiarity with LLM provider APIs (OpenAI, Anthropic, or similar)"
  - "Basic knowledge of abstraction patterns (interfaces, adapters)"
  - "Experience with context window limitations"
  - "**Blog 1: Foundations** - Context windows, tokens, and semantic representation"
tags:
  - "context-engineering"
  - "llm"
  - "ai"
  - "api"
publishedDate: "2025-12-08"
---

# Cross-Platform Portability - Building Vendor-Agnostic Context Systems

## Abstract

As organizations adopt large language models from multiple providers—OpenAI, Anthropic, Google, Cohere, and others—the need for vendor-agnostic context systems becomes critical. This blog explores architectural patterns for building portable context engineering solutions that abstract provider-specific implementations, enable seamless provider switching, and maintain consistent behavior across heterogeneous LLM ecosystems.

We examine abstraction layer design principles, provider compatibility patterns, migration strategies, and best practices drawn from production deployments managing multi-vendor LLM infrastructures. Whether you're building a new context system or refactoring an existing implementation, these patterns will help you achieve true cross-platform portability while preserving provider-specific optimizations when needed.

Key insights include unified interface design for diverse LLM APIs, strategies for handling variable context window sizes across providers, techniques for maintaining semantic consistency despite different tokenization schemes, and approaches to testing and validation in multi-provider environments.


## Prerequisites

**Required Knowledge**:
- Understanding of RESTful API design principles
- Familiarity with LLM provider APIs (OpenAI, Anthropic, or similar)
- Basic knowledge of abstraction patterns (interfaces, adapters)
- Experience with context window limitations

**Recommended Reading**:
- **Blog 1: Foundations** - Context windows, tokens, and semantic representation
- **Blog 4: MCP Fundamentals** - Standardized interfaces for tool integration
- **Blog 9: Production Deployment** - Infrastructure and reliability patterns

**Estimated Time**: 35 minutes


## Table of Contents

1. The Portability Challenge
2. Abstraction Layer Design
3. Provider Compatibility Patterns
4. Migration Strategies
5. Best Practices and Trade-offs
6. Key Takeaways
7. Next Steps
8. References


## 1. The Portability Challenge

### 1.1 Why Vendor Lock-In Matters

The LLM landscape evolves rapidly. A provider offering the best performance today may be surpassed tomorrow. Organizations face several portability challenges:

**Cost Optimization**: Provider pricing varies significantly. OpenAI's GPT-4 costs approximately $0.03 per 1K input tokens, while Anthropic's Claude 3.5 Sonnet costs $0.003 per 1K tokens—a 10x difference [OpenAI, 2024; Anthropic, 2024]. Without portability, you cannot dynamically switch to cost-effective providers.

**Risk Mitigation**: Single-provider dependence creates operational risk. Service outages, rate limit changes, or deprecated models can halt production systems. Multi-provider architectures provide failover capabilities.

**Performance Heterogeneity**: Different providers excel at different tasks. GPT-4 may perform better on code generation, while Claude 3.5 excels at long-context reasoning. Portable systems can route requests to optimal providers per task.

**Regulatory Compliance**: Data residency requirements may mandate specific providers in certain regions. European deployments might prefer providers with EU data centers, requiring seamless provider switching without application changes.

[VISUAL: Decision flowchart showing provider selection logic based on cost, latency, accuracy, and compliance requirements]

### 1.2 The Heterogeneity Problem

LLM providers differ significantly in their technical specifications:

| Provider | Context Window | Token Encoding | API Pattern | Streaming | Tool Calling |
|----------|----------------|----------------|-------------|-----------|--------------|
| OpenAI GPT-4 | 128K tokens | tiktoken (cl100k_base) | Chat completions | Yes | Function calling |
| Anthropic Claude 3.5 | 200K tokens | Custom tokenizer | Messages API | Yes | Tool use |
| Google Gemini 1.5 | 1M tokens | SentencePiece | GenerateContent | Yes | Function declarations |
| Cohere Command R+ | 128K tokens | Custom BPE | Chat API | Yes | Tools |
| Meta Llama 3 | 8K tokens | tiktoken (gpt-4) | Completions | Depends | Via prompting |

**Key Differences**:
- **Context window sizes** range from 8K to 1M tokens
- **Tokenization schemes** vary, meaning identical text produces different token counts
- **API contracts** use different request/response formats
- **Feature support** is inconsistent (streaming, tool calling, vision)

Building context systems that work seamlessly across these providers requires sophisticated abstraction.

### 1.3 The Semantic Consistency Challenge

Even when APIs align structurally, providers may interpret identical prompts differently:

**Example**: The same prompt sent to three providers:

```python
prompt = "Summarize this technical document in 3 bullet points: [10K token document]"

# GPT-4 response (average): 85 tokens, executive summary style
# Claude 3.5 response (average): 120 tokens, detailed technical style
# Gemini 1.5 response (average): 95 tokens, conceptual overview style
```

Portable systems must account for these behavioral differences through:
- **Prompt adaptation**: Adjusting prompts per provider to achieve consistent outputs
- **Response normalization**: Post-processing outputs to maintain semantic equivalence
- **Quality validation**: Testing that all providers meet accuracy thresholds

Building on the context optimization techniques from **Blog 1: Foundations**, we now examine how to maintain semantic consistency across provider boundaries.


## 2. Abstraction Layer Design

### 2.1 The Adapter Pattern for LLM Providers

The **Adapter pattern** (also called wrapper or translator) provides a unified interface to diverse provider APIs [Gamma et al., 1994]. This pattern isolates provider-specific logic from application code.

**Core Architecture**:

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, AsyncIterator
from dataclasses import dataclass

@dataclass
class ContextMessage:
    """Unified message format across providers."""
    role: str  # "user", "assistant", "system"
    content: str
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class LLMResponse:
    """Unified response format."""
    content: str
    model: str
    tokens_used: int
    latency_ms: float
    finish_reason: str
    provider: str

class LLMProvider(ABC):
    """Abstract base class for all LLM providers."""

    @abstractmethod
    async def complete(
        self,
        messages: List[ContextMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate a completion."""
        pass

    @abstractmethod
    async def stream_complete(
        self,
        messages: List[ContextMessage],
        model: str,
        **kwargs
    ) -> AsyncIterator[str]:
        """Stream a completion."""
        pass

    @abstractmethod
    def count_tokens(self, text: str, model: str) -> int:
        """Count tokens for the given text and model."""
        pass

    @abstractmethod
    def get_context_window(self, model: str) -> int:
        """Return max context window for model."""
        pass
```

**OpenAI Adapter Implementation**:

```python
import openai
from openai import AsyncOpenAI

class OpenAIProvider(LLMProvider):
    """Adapter for OpenAI GPT models."""

    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)
        self.tokenizer = tiktoken.encoding_for_model("gpt-4")

    async def complete(
        self,
        messages: List[ContextMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        start = time.time()

        # Convert unified messages to OpenAI format
        openai_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

        response = await self.client.chat.completions.create(
            model=model,
            messages=openai_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )

        return LLMResponse(
            content=response.choices[0].message.content,
            model=model,
            tokens_used=response.usage.total_tokens,
            latency_ms=(time.time() - start) * 1000,
            finish_reason=response.choices[0].finish_reason,
            provider="openai"
        )

    async def stream_complete(
        self,
        messages: List[ContextMessage],
        model: str,
        **kwargs
    ) -> AsyncIterator[str]:
        openai_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

        stream = await self.client.chat.completions.create(
            model=model,
            messages=openai_messages,
            stream=True,
            **kwargs
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    def count_tokens(self, text: str, model: str) -> int:
        return len(self.tokenizer.encode(text))

    def get_context_window(self, model: str) -> int:
        # Model-specific context windows
        context_windows = {
            "gpt-4": 8192,
            "gpt-4-32k": 32768,
            "gpt-4-turbo": 128000,
            "gpt-3.5-turbo": 16385,
        }
        return context_windows.get(model, 8192)
```

**Anthropic Adapter Implementation**:

```python
import anthropic
from anthropic import AsyncAnthropic

class AnthropicProvider(LLMProvider):
    """Adapter for Anthropic Claude models."""

    def __init__(self, api_key: str):
        self.client = AsyncAnthropic(api_key=api_key)

    async def complete(
        self,
        messages: List[ContextMessage],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        start = time.time()

        # Extract system message if present
        system_msg = None
        user_messages = []

        for msg in messages:
            if msg.role == "system":
                system_msg = msg.content
            else:
                user_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

        # Anthropic requires max_tokens (no default)
        if max_tokens is None:
            max_tokens = 4096

        response = await self.client.messages.create(
            model=model,
            messages=user_messages,
            system=system_msg,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )

        return LLMResponse(
            content=response.content[0].text,
            model=model,
            tokens_used=response.usage.input_tokens + response.usage.output_tokens,
            latency_ms=(time.time() - start) * 1000,
            finish_reason=response.stop_reason,
            provider="anthropic"
        )

    async def stream_complete(
        self,
        messages: List[ContextMessage],
        model: str,
        **kwargs
    ) -> AsyncIterator[str]:
        system_msg = None
        user_messages = []

        for msg in messages:
            if msg.role == "system":
                system_msg = msg.content
            else:
                user_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

        async with self.client.messages.stream(
            model=model,
            messages=user_messages,
            system=system_msg,
            max_tokens=kwargs.get("max_tokens", 4096),
            **{k: v for k, v in kwargs.items() if k != "max_tokens"}
        ) as stream:
            async for text in stream.text_stream:
                yield text

    def count_tokens(self, text: str, model: str) -> int:
        # Use Anthropic's token counting API
        # For now, approximate with GPT-4 tokenizer (rough estimate)
        # In production, call anthropic.count_tokens()
        return len(tiktoken.encoding_for_model("gpt-4").encode(text))

    def get_context_window(self, model: str) -> int:
        context_windows = {
            "claude-3-opus-20240229": 200000,
            "claude-3-sonnet-20240229": 200000,
            "claude-3-haiku-20240307": 200000,
            "claude-3-5-sonnet-20241022": 200000,
        }
        return context_windows.get(model, 200000)
```

[VISUAL: Class diagram showing LLMProvider abstract base class with OpenAIProvider, AnthropicProvider, GeminiProvider, and CohereProvider concrete implementations]

### 2.2 Provider Registry and Factory Pattern

The **Factory pattern** enables dynamic provider selection at runtime:

```python
from typing import Dict, Type
from enum import Enum

class ProviderType(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    COHERE = "cohere"

class LLMProviderRegistry:
    """Registry for managing LLM providers."""

    _providers: Dict[ProviderType, Type[LLMProvider]] = {}
    _instances: Dict[ProviderType, LLMProvider] = {}

    @classmethod
    def register(cls, provider_type: ProviderType, provider_class: Type[LLMProvider]):
        """Register a provider implementation."""
        cls._providers[provider_type] = provider_class

    @classmethod
    def create(cls, provider_type: ProviderType, **config) -> LLMProvider:
        """Create a provider instance."""
        if provider_type not in cls._providers:
            raise ValueError(f"Unknown provider: {provider_type}")

        # Singleton pattern: reuse instances
        if provider_type not in cls._instances:
            provider_class = cls._providers[provider_type]
            cls._instances[provider_type] = provider_class(**config)

        return cls._instances[provider_type]

    @classmethod
    def get_all_providers(cls) -> List[ProviderType]:
        """List all registered providers."""
        return list(cls._providers.keys())

# Register providers
LLMProviderRegistry.register(ProviderType.OPENAI, OpenAIProvider)
LLMProviderRegistry.register(ProviderType.ANTHROPIC, AnthropicProvider)
LLMProviderRegistry.register(ProviderType.GEMINI, GeminiProvider)
LLMProviderRegistry.register(ProviderType.COHERE, CohereProvider)

# Usage
provider = LLMProviderRegistry.create(
    ProviderType.OPENAI,
    api_key=os.getenv("OPENAI_API_KEY")
)

response = await provider.complete(
    messages=[
        ContextMessage(role="user", content="Explain quantum computing")
    ],
    model="gpt-4-turbo"
)
```

**Benefits**:
- **Loose coupling**: Application code depends on abstractions, not concrete providers
- **Dynamic configuration**: Switch providers via environment variables or config files
- **Testability**: Mock 

![Smart Router Decision Logic](/images/context-engineering/blog10_concept05_smart_router.png)
*Figure: Smart Router Decision Logic* — Decision flowchart for provider routing: request arrives → check required features → filter compatible providers → apply cost constraints → apply latency constraints → select optimal provider, with decision criteria at each step



![Migration Phases Timeline](/images/context-engineering/blog10_concept04_migration_phases.png)
*Figure: Migration Phases Timeline* — Three-phase migration visualization: Phase 1 Shadow Mode (2 weeks, dual-write, comparison), Phase 2 Cutover (2 weeks, switch primary/shadow, validation), Phase 3 Cleanup (1 week, remove dual-write), with rollback points and health checks



![Provider Abstraction Architecture](/images/context-engineering/blog10_concept01_provider_abstraction.png)
*Figure: Provider Abstraction Architecture* — Abstraction layer showing unified LLMProvider interface at top, concrete implementations (OpenAIProvider, AnthropicProvider, GeminiProvider, CohereProvider) below, with provider registry and factory pattern

providers for unit testing without API calls

### 2.3 Unified Configuration Schema

A portable system requires provider-agnostic configuration:

```yaml
# context_config.yaml
llm_providers:
  openai:
    api_key: ${OPENAI_API_KEY}
    default_model: gpt-4-turbo
    timeout: 30
    retry_attempts: 3
    rate_limit: 3500  # requests per minute

  anthropic:
    api_key: ${ANTHROPIC_API_KEY}
    default_model: claude-3-5-sonnet-20241022
    timeout: 60
    retry_attempts: 3
    rate_limit: 1000

  gemini:
    api_key: ${GEMINI_API_KEY}
    default_model: gemini-1.5-pro
    timeout: 45
    retry_attempts: 3
    rate_limit: 500

routing:
  default_provider: anthropic

  # Route by task type
  task_routing:
    code_generation: openai
    long_context: gemini
    reasoning: anthropic

  # Fallback chain
  failover:
    - anthropic
    - openai
    - gemini

  # Cost-based routing
  cost_priority:
    enabled: true
    max_cost_per_request: 0.10  # USD

context_optimization:
  max_tokens_per_request: 8000
  truncation_strategy: semantic_chunks
  compression_enabled: true
```

**Configuration Management**:

```python
from typing import Dict, Any
import yaml
import os

class ContextConfig:
    """Unified configuration for multi-provider context systems."""

    def __init__(self, config_path: str):
        with open(config_path, 'r') as f:
            config_str = os.path.expandvars(f.read())
            self.config: Dict[str, Any] = yaml.safe_load(config_str)

    def get_provider_config(self, provider: ProviderType) -> Dict[str, Any]:
        """Get configuration for a specific provider."""
        return self.config["llm_providers"].get(provider.value, {})

    def get_default_provider(self) -> ProviderType:
        """Get the default provider."""
        provider_name = self.config["routing"]["default_provider"]
        return ProviderType(provider_name)

    def get_task_provider(self, task_type: str) -> ProviderType:
        """Get provider for a specific task type."""
        task_routing = self.config["routing"].get("task_routing", {})
        provider_name = task_routing.get(task_type)

        if provider_name:
            return ProviderType(provider_name)

        return self.get_default_provider()

    def get_failover_chain(self) -> List[ProviderType]:
        """Get ordered list of fallback providers."""
        failover = self.config["routing"].get("failover", [])
        return [ProviderType(p) for p in failover]
```

[VISUAL: Sequence diagram showing configuration loading → provider selection → fallback chain execution on provider failure]


## 3. Provider Compatibility Patterns

### 3.1 Token Normalization Strategy

Different tokenization schemes mean identical text has different token counts across providers. This complicates context window management.

**Problem**: A 10,000-word document might be:
- 13,500 tokens in GPT-4 (tiktoken/cl100k_base)
- 15,200 tokens in Claude 3.5 (custom tokenizer)
- 12,800 tokens in Gemini (SentencePiece)

**Solution**: Character-based estimation with provider-specific calibration [Radford et al., 2019].

```python
from dataclasses import dataclass
from typing import Dict

@dataclass
class TokenEstimation:
    """Token count estimation with confidence intervals."""
    estimated_tokens: int
    min_tokens: int
    max_tokens: int
    confidence: float

class TokenNormalizer:
    """Normalize token counts across providers."""

    # Calibration data: average tokens per character
    TOKENS_PER_CHAR: Dict[ProviderType, float] = {
        ProviderType.OPENAI: 0.27,      # GPT-4 tiktoken
        ProviderType.ANTHROPIC: 0.30,   # Claude custom
        ProviderType.GEMINI: 0.25,      # SentencePiece
        ProviderType.COHERE: 0.28,      # Custom BPE
    }

    # Variance (standard deviation) for estimation
    TOKEN_VARIANCE: Dict[ProviderType, float] = {
        ProviderType.OPENAI: 0.03,
        ProviderType.ANTHROPIC: 0.04,
        ProviderType.GEMINI: 0.02,
        ProviderType.COHERE: 0.03,
    }

    @classmethod
    def estimate_tokens(
        cls,
        text: str,
        provider: ProviderType
    ) -> TokenEstimation:
        """Estimate token count for a given provider."""
        char_count = len(text)
        tokens_per_char = cls.TOKENS_PER_CHAR.get(provider, 0.27)
        variance = cls.TOKEN_VARIANCE.get(provider, 0.03)

        estimated = int(char_count * tokens_per_char)
        margin = int(char_count * variance)

        return TokenEstimation(
            estimated_tokens=estimated,
            min_tokens=max(0, estimated - margin),
            max_tokens=estimated + margin,
            confidence=0.95  # 95% confidence interval
        )

    @classmethod
    def convert_tokens(
        cls,
        token_count: int,
        from_provider: ProviderType,
        to_provider: ProviderType
    ) -> int:
        """Convert token count from one provider to another."""
        # Convert to character estimate, then to target provider
        from_ratio = cls.TOKENS_PER_CHAR[from_provider]
        to_ratio = cls.TOKENS_PER_CHAR[to_provider]

        estimated_chars = token_count / from_ratio
        target_tokens = int(estimated_chars * to_ratio)

        return target_tokens
```

**Usage Example**:

```python
text = "Long document content..." * 1000  # 10K words

# Estimate tokens for each provider
openai_estimate = TokenNormalizer.estimate_tokens(text, ProviderType.OPENAI)
anthropic_estimate = TokenNormalizer.estimate_tokens(text, ProviderType.ANTHROPIC)

print(f"OpenAI estimate: {openai_estimate.estimated_tokens} tokens "
      f"({openai_estimate.min_tokens}-{openai_estimate.max_tokens})")
print(f"Anthropic estimate: {anthropic_estimate.estimated_tokens} tokens "
      f"({anthropic_estimate.min_tokens}-{anthropic_estimate.max_tokens})")

# Convert token budget from OpenAI to Anthropic
openai_budget = 8000
anthropic_budget = TokenNormalizer.convert_tokens(
    openai_budget,
    ProviderType.OPENAI,
    ProviderType.ANTHROPIC
)
print(f"8000 OpenAI tokens ≈ {anthropic_budget} Anthropic tokens")
```

**Calibration Process**: Periodically update `TOKENS_PER_CHAR` by measuring actual token counts on representative data:

```python
def calibrate_tokenizer(provider: LLMProvider, sample_texts: List[str]) -> float:
    """Calibrate tokens-per-character ratio for a provider."""
    total_chars = 0
    total_tokens = 0

    for text in sample_texts:
        total_chars += len(text)
        total_tokens += provider.count_tokens(text, provider.default_model)

    return total_tokens / total_chars

# Run calibration monthly
sample_texts = load_representative_corpus()  # Mix of code, prose, technical docs
ratio = calibrate_tokenizer(anthropic_provider, sample_texts)
print(f"Measured ratio: {ratio:.4f} tokens/char")
```

### 3.2 Context Window Adaptation

Providers support vastly different context windows. A system designed for Claude's 200K tokens may fail when using GPT-4's 8K token limit.

**Adaptive Chunking Strategy**:

```python
from typing import List, Tuple

class ContextWindowAdapter:
    """Adapt context to fit provider-specific windows."""

    def __init__(self, config: ContextConfig):
        self.config = config

    async def adapt_context(
        self,
        messages: List[ContextMessage],
        provider: LLMProvider,
        model: str,
        reserve_tokens: int = 1000  # Reserve for response
    ) -> List[ContextMessage]:
        """Adapt messages to fit provider's context window."""
        max_window = provider.get_context_window(model)
        available_tokens = max_window - reserve_tokens

        # Count current tokens
        current_tokens = sum(
            provider.count_tokens(msg.content, model)
            for msg in messages
        )

        if current_tokens <= available_tokens:
            return messages  # Fits as-is

        # Need to truncate/compress
        return await self._truncate_context(
            messages,
            available_tokens,
            provider,
            model
        )

    async def _truncate_context(
        self,
        messages: List[ContextMessage],
        target_tokens: int,
        provider: LLMProvider,
        model: str
    ) -> List[ContextMessage]:
        """Intelligently truncate context to fit token budget."""
        # Strategy 1: Keep system message and most recent messages
        system_messages = [m for m in messages if m.role == "system"]
        user_messages = [m for m in messages if m.role != "system"]

        # Always preserve system prompt
        result = system_messages.copy()
        tokens_used = sum(
            provider.count_tokens(m.content, model)
            for m in system_messages
        )

        # Add messages from most recent backward
        for msg in reversed(user_messages):
            msg_tokens = provider.count_tokens(msg.content, model)

            if tokens_used + msg_tokens <= target_tokens:
                result.insert(len(system_messages), msg)
                tokens_used += msg_tokens
            else:
                # Truncate this message to fit
                remaining_tokens = target_tokens - tokens_used
                if remaining_tokens > 100:  # Only if meaningful space left
                    truncated_content = self._truncate_text(
                        msg.content,
                        remaining_tokens,
                        provider,
                        model
                    )
                    result.insert(len(system_messages), ContextMessage(
                        role=msg.role,
                        content=truncated_content
                    ))
                break

        return result

    def _truncate_text(
        self,
        text: str,
        target_tokens: int,
        provider: LLMProvider,
        model: str
    ) -> str:
        """Truncate text to approximately target tokens."""
        # Use character-based estimation for efficiency
        tokens_per_char = 0.27  # Average across providers
        target_chars = int(target_tokens / tokens_per_char)

        if len(text) <= target_chars:
            return text

        # Truncate with ellipsis
        truncated = text[:target_chars - 20] + "\n\n[Content truncated...]"

        # Verify token count
        actual_tokens = provider.count_tokens(truncated, model)
        if actual_tokens > target_tokens:
            # Recursively truncate further
            return self._truncate_text(
                text,
                target_tokens - 50,
                provider,
                model
            )

        return truncated
```

**Semantic Compression** (Advanced): Instead of naive truncation, use semantic compression techniques from **Blog 1: Foundations**:

```python
async def _semantic_compress(
    self,
    messages: List[ContextMessage],
    target_tokens: int,
    provider: LLMProvider,
    model: str
) -> List[ContextMessage]:
    """Compress context using semantic summarization."""
    # Identify compressible messages (older conversation turns)
    compressible = messages[1:-3]  # Keep system + 3 most recent
    preserved = [messages[0]] + messages[-3:]

    # Summarize compressible portion
    summarization_prompt = f"""Summarize the following conversation history
    in approximately {target_tokens // 2} tokens, preserving key facts and context:

    {self._format_messages(compressible)}
    """

    summary_response = await provider.complete(
        messages=[ContextMessage(role="user", content=summarization_prompt)],
        model=model,
        max_tokens=target_tokens // 2
    )

    # Replace compressible messages with summary
    return [
        messages[0],  # System message
        ContextMessage(
            role="assistant",
            content=f"[Previous conversation summary]\n{summary_response.content}"
        )
    ] + messages[-3:]  # Recent messages
```

[VISUAL: Comparison diagram showing naive truncation vs. semantic compression, with token savings and information retention metrics]

### 3.3 Feature Compatibility Matrix

Not all providers support all features. A portable system must gracefully degrade:

```python
from enum import Flag, auto
from typing import Set

class LLMFeature(Flag):
    """Feature flags for LLM capabilities."""
    STREAMING = auto()
    TOOL_CALLING = auto()
    VISION = auto()
    JSON_MODE = auto()
    FUNCTION_CALLING = auto()
    SYSTEM_MESSAGE = auto()
    STOP_SEQUENCES = auto()
    LOGPROBS = auto()

class FeatureCompatibility:
    """Track feature support across providers."""

    PROVIDER_FEATURES: Dict[ProviderType, LLMFeature] = {
        ProviderType.OPENAI: (
            LLMFeature.STREAMING |
            LLMFeature.TOOL_CALLING |
            LLMFeature.VISION |
            LLMFeature.JSON_MODE |
            LLMFeature.FUNCTION_CALLING |
            LLMFeature.SYSTEM_MESSAGE |
            LLMFeature.STOP_SEQUENCES |
            LLMFeature.LOGPROBS
        ),
        ProviderType.ANTHROPIC: (
            LLMFeature.STREAMING |
            LLMFeature.TOOL_CALLING |
            LLMFeature.VISION |
            LLMFeature.SYSTEM_MESSAGE |
            LLMFeature.STOP_SEQUENCES
        ),
        ProviderType.GEMINI: (
            LLMFeature.STREAMING |
            LLMFeature.TOOL_CALLING |
            LLMFeature.VISION |
            LLMFeature.FUNCTION_CALLING |
            LLMFeature.STOP_SEQUENCES
        ),
        ProviderType.COHERE: (
            LLMFeature.STREAMING |
            LLMFeature.TOOL_CALLING |
            LLMFeature.STOP_SEQUENCES
        ),
    }

    @classmethod
    def supports_feature(
        cls,
        provider: ProviderType,
        feature: LLMFeature
    ) -> bool:
        """Check if a provider supports a feature."""
        provider_features = cls.PROVIDER_FEATURES.get(provider, LLMFeature(0))
        return bool(provider_features & feature)

    @classmethod
    def get_compatible_providers(
        cls,
        required_features: Set[LLMFeature]
    ) -> List[ProviderType]:
        """Find providers supporting all required features."""
        compatible = []

        for provider, features in cls.PROVIDER_FEATURES.items():
            if all(cls.supports_feature(provider, f) for f in required_features):
                compatible.append(provider)

        return compatible
```

**Feature-Aware Routing**:

```python
class SmartRouter:
    """Route requests to compatible providers."""

    def __init__(self, config: ContextConfig):
        self.config = config

    async def route_request(
        self,
        messages: List[ContextMessage],
        required_features: Set[LLMFeature],
        preferences: Optional[Dict[str, Any]] = None
    ) -> Tuple[LLMProvider, str]:
        """Route request to optimal compatible provider."""
        # Find compatible providers
        compatible = FeatureCompatibility.get_compatible_providers(
            required_features
        )


![Provider Feature Compatibility Matrix](/images/context-engineering/blog10_concept02_feature_compatibility.png)
*Figure: Provider Feature Compatibility Matrix* — Detailed matrix showing feature support across providers: OpenAI, Anthropic, Gemini, Cohere, with features (streaming, tool calling, vision, JSON mode, system message, stop sequences) marked as supported/not supported


        if not compatible:
            raise ValueError(
                f"No providers support required features: {required_features}"
            )

        # Apply preferences
        if preferences:
            if "max_cost" in preferences:
                compatible = self._filter_by_cost(compatible, preferences["max_cost"])

            if "max_latency" in preferences:
                compatible = self._filter_by_latency(compatible, preferences["max_latency"])

        # Select optimal provider
        selected = self._select_optimal(compatible, preferences or {})

        # Create provider instance
        provider_config = self.config.get_provider_config(selected)
        provider = LLMProviderRegistry.create(selected, **provider_config)

        # Select model
        model = self._select_model(selected, messages)

        return provider, model

    def _select_optimal(
        self,
        candidates: List[ProviderType],
        preferences: Dict[str, Any]
    ) -> ProviderType:
        """Select optimal provider from candidates."""
        # Default priority: cost > latency > quality
        priority = preferences.get("priority", "cost")

        if priority == "cost":
            # Return cheapest provider
            cost_order = [
                ProviderType.ANTHROPIC,  # $0.003/1K
                ProviderType.COHERE,     # $0.005/1K
                ProviderType.GEMINI,     # $0.007/1K
                ProviderType.OPENAI,     # $0.03/1K
            ]
            for provider in cost_order:
                if provider in candidates:
                    return provider

        elif priority == "latency":
            # Return fastest provider
            latency_order = [
                ProviderType.OPENAI,     # ~500ms p50
                ProviderType.COHERE,     # ~600ms p50
                ProviderType.ANTHROPIC,  # ~700ms p50
                ProviderType.GEMINI,     # ~800ms p50
            ]
            for provider in latency_order:
                if provider in candidates:
                    return provider

        elif priority == "quality":
            # Return highest quality provider
            quality_order = [
                ProviderType.ANTHROPIC,  # Claude 3.5 Sonnet
                ProviderType.OPENAI,     # GPT-4 Turbo
                ProviderType.GEMINI,     # Gemini 1.5 Pro
                ProviderType.COHERE,     # Command R+
            ]
            for provider in quality_order:
                if provider in candidates:
                    return provider

        # Fallback: return first candidate
        return candidates[0]
```

**Usage Example**:

```python
# Request with tool calling
router = SmartRouter(config)

provider, model = await router.route_request(
    messages=conversation_history,
    required_features={LLMFeature.STREAMING, LLMFeature.TOOL_CALLING},
    preferences={"priority": "cost", "max_cost": 0.05}
)

print(f"Routed to {provider.provider} with model {model}")
# Output: "Routed to anthropic with model claude-3-5-sonnet-20241022"
```

[VISUAL: Feature compatibility matrix table with providers as rows, features as columns, colored cells indicating support level]


## 4. Migration Strategies

### 4.1 Dual-Write Pattern for Zero-Downtime Migration

When migrating from Provider A to Provider B, use the **dual-write pattern** to validate compatibility before full cutover:

**Phase 1: Shadow Mode** (Read from A, write to both)

```python
class DualWriteProvider(LLMProvider):
    """Proxy that writes to primary and shadow providers."""

    def __init__(
        self,
        primary: LLMProvider,
        shadow: LLMProvider,
        comparison_enabled: bool = True
    ):
        self.primary = primary
        self.shadow = shadow
        self.comparison_enabled = comparison_enabled
        self.metrics = MigrationMetrics()

    async def complete(
        self,
        messages: List[ContextMessage],
        model: str,
        **kwargs
    ) -> LLMResponse:
        """Complete with dual-write to primary and shadow."""
        # Always get primary response
        primary_response = await self.primary.complete(messages, model, **kwargs)

        # Asynchronously get shadow response for comparison
        if self.comparison_enabled:
            asyncio.create_task(
                self._shadow_compare(messages, model, primary_response, kwargs)
            )

        # Always return primary response
        return primary_response

    async def _shadow_compare(
        self,
        messages: List[ContextMessage],
        model: str,
        primary_response: LLMResponse,
        kwargs: Dict[str, Any]
    ):
        """Compare shadow response to primary (async)."""
        try:
            shadow_response = await self.shadow.complete(messages, model, **kwargs)

            # Log comparison metrics
            self.metrics.record_comparison(
                primary=primary_response,
                shadow=shadow_response,
                messages=messages
            )

            # Check for significant divergence
            divergence = self._calculate_divergence(
                primary_response.content,
                shadow_response.content
            )

            if divergence > 0.3:  # 30% threshold
                logger.warning(
                    f"High divergence detected: {divergence:.2%}",
                    extra={
                        "primary_provider": primary_response.provider,
                        "shadow_provider": shadow_response.provider,
                        "divergence": divergence
                    }
                )

        except Exception as e:
            logger.error(f"Shadow comparison failed: {e}")
            self.metrics.record_shadow_error(e)

    def _calculate_divergence(self, text1: str, text2: str) -> float:
        """Calculate semantic divergence between responses."""
        # Use simple Levenshtein distance normalized by length
        # In production, use semantic similarity (embeddings)
        from Levenshtein import distance

        max_len = max(len(text1), len(text2))
        if max_len == 0:
            return 0.0

        return distance(text1, text2) / max_len
```

**Migration Metrics Dashboard**:

```python
from dataclasses import dataclass, field
from typing import List
import numpy as np

@dataclass
class MigrationMetrics:
    """Track migration progress and quality."""

    comparisons: int = 0
    shadow_errors: int = 0

    latency_primary: List[float] = field(default_factory=list)
    latency_shadow: List[float] = field(default_factory=list)

    cost_primary: List[float] = field(default_factory=list)
    cost_shadow: List[float] = field(default_factory=list)

    divergences: List[float] = field(default_factory=list)

    def record_comparison(
        self,
        primary: LLMResponse,
        shadow: LLMResponse,
        messages: List[ContextMessage]
    ):
        """Record comparison metrics."""
        self.comparisons += 1

        self.latency_primary.append(primary.latency_ms)
        self.latency_shadow.append(shadow.latency_ms)

        # Estimate cost (simplified)
        primary_cost = self._estimate_cost(primary)
        shadow_cost = self._estimate_cost(shadow)

        self.cost_primary.append(primary_cost)
        self.cost_shadow.append(shadow_cost)

        # Calculate divergence
        divergence = self._calculate_semantic_divergence(
            primary.content,
            shadow.content
        )
        self.divergences.append(divergence)

    def record_shadow_error(self, error: Exception):
        """Record shadow provider error."""
        self.shadow_errors += 1

    def get_summary(self) -> Dict[str, Any]:
        """Generate migration summary report."""
        if not self.comparisons:
            return {"status": "No comparisons yet"}

        return {
            "comparisons": self.comparisons,
            "shadow_errors": self.shadow_errors,
            "error_rate": self.shadow_errors / self.comparisons,

            "latency": {
                "primary_p50": np.percentile(self.latency_primary, 50),
                "primary_p99": np.percentile(self.latency_primary, 99),
                "shadow_p50": np.percentile(self.latency_shadow, 50),
                "shadow_p99": np.percentile(self.latency_shadow, 99),
                "improvement": (
                    np.mean(self.latency_primary) - np.mean(self.latency_shadow)
                ) / np.mean(self.latency_primary)
            },

            "cost": {
                "primary_total": sum(self.cost_primary),
                "shadow_total": sum(self.cost_shadow),
                "savings": sum(self.cost_primary) - sum(self.cost_shadow),
                "savings_pct": (
                    sum(self.cost_primary) - sum(self.cost_shadow)
                ) / sum(self.cost_primary)
            },

            "quality": {
                "mean_divergence": np.mean(self.divergences),
                "max_divergence": np.max(self.divergences),
                "divergence_p95": np.percentile(self.divergences, 95),
                "high_divergence_pct": sum(
                    1 for d in self.divergences if d > 0.3
                ) / len(self.divergences)
            }
        }
```

**Phase 2: Cutover** (Switch primary)

After validating shadow performance for 7-14 days:

```python
# Switch primary and shadow roles
dual_provider = DualWriteProvider(
    primary=new_provider,  # Was shadow
    shadow=old_provider,   # Was primary
    comparison_enabled=True
)

# Monitor for another 7 days before full cutover
```

**Phase 3: Cleanup** (Remove shadow)

```python
# After successful cutover, remove dual-write overhead
final_provider = new_provider
```

[VISUAL: Timeline diagram showing 3-phase migration: Shadow (2 weeks) → Cutover (2 weeks) → Cleanup, with rollback points marked]

### 4.2 Prompt Migration and Testing

Provider-specific prompt engineering patterns may not transfer directly. Systematically test and adapt prompts:

```python
class PromptMigrationTester:
    """Test prompt portability across providers."""

    def __init__(
        self,
        source_provider: LLMProvider,
        target_provider: LLMProvider
    ):
        self.source = source_provider
        self.target = target_provider

    async def test_prompt(
        self,
        messages: List[ContextMessage],
        test_cases: List[Dict[str, Any]],
        quality_threshold: float = 0.85
    ) -> PromptMigrationReport:
        """Test prompt across providers."""
        results = []

        for test_case in test_cases:
            # Get responses from both providers
            source_response = await self.source.complete(
                messages=messages,
                model=self.source.default_model,
                **test_case.get("params", {})
            )

            target_response = await self.target.complete(
                messages=messages,
                model=self.target.default_model,
                **test_case.get("params", {})
            )

            # Evaluate quality
            quality_score = self._evaluate_quality(
                source_response.content,
                target_response.content,
                test_case.get("expected_output"),
                test_case.get("quality_criteria", [])
            )

            results.append({
                "test_case": test_case["name"],
                "source_response": source_response.content,
                "target_response": target_response.content,
                "quality_score": quality_score,
                "passed": quality_score >= quality_threshold
            })

        return PromptMigrationReport(
            results=results,
            pass_rate=sum(r["passed"] for r in results) / len(results)
        )

    def _evaluate_quality(
        self,
        source_output: str,
        target_output: str,
        expected_output: Optional[str],
        criteria: List[str]
    ) -> float:
        """Evaluate output quality."""
        scores = []

        # Semantic similarity
        similarity = self._semantic_similarity(source_output, target_output)
        scores.append(similarity)

        # Expected output match (if provided)
        if expected_output:
            expected_similarity = self._semantic_similarity(
                target_output,
                expected_output
            )
            scores.append(expected_similarity)

        # Criteria-based evaluation
        for criterion in criteria:
            criterion_score = self._evaluate_criterion(target_output, criterion)
            scores.append(criterion_score)

        return np.mean(scores)
```

**Example Migration Test Suite**:

```python
# Define test cases
test_cases = [
    {
        "name": "code_generation",
        "params": {"temperature": 0.2},
        "quality_criteria": [
            "contains_valid_python",
            "includes_docstring",
            "follows_pep8"
        ]
    },
    {
        "name": "summarization",
        "params": {"max_tokens": 200},
        "quality_criteria": [
            "under_200_words",
            "contains_key_points",
            "maintains_tone"
        ]
    },
    {
        "name": "reasoning",
        "params": {"temperature": 0.7},
        "expected_output": "Step-by-step reasoning leading to conclusion",
        "quality_criteria": [
            "shows_reasoning_steps",
            "reaches_logical_conclusion"
        ]
    }
]

# Run migration test
tester = PromptMigrationTester(
    source_provider=openai_provider,
    target_provider=anthropic_provider
)

report = await tester.test_prompt(
    messages=[ContextMessage(role="user", content="Explain recursion")],
    test_cases=test_cases,
    quality_threshold=0.85
)

print(f"Migration Pass Rate: {report.pass_rate:.1%}")
for result in report.results:
    print(f"{result['test_case']}: {'✓' if result['passed'] else '✗'} "
          f"(score: {result['quality_score']:.2f})")
```

### 4.3 Rollback Strategy

Always maintain ability to rollback during migration:

```python
class MigrationController:
    """Control migration with automated rollback."""

    def __init__(
        self,
        old_provider: LLMProvider,
        new_provider: LLMProvider,
        rollback_thresholds: Dict[str, float]
    ):
        self.old_provider = old_provider
        self.new_provider = new_provider
        self.thresholds = rollback_thresholds
        self.metrics = MigrationMetrics()
        self.current_provider = old_provider
        self.migration_phase = "old"  # old, shadow, cutover, new

    async def check_health(self) -> bool:
        """Check if migration should continue or rollback."""
        summary = self.metrics.get_summary()

        # Check error rate
        if summary.get("error_rate", 0) > self.thresholds["max_error_rate"]:
            logger.error(
                f"Error rate {summary['error_rate']:.1%} exceeds "
                f"threshold {self.thresholds['max_error_rate']:.1%}"
            )
            await self.rollback("high_error_rate")
            return False

        # Check latency degradation
        latency_change = summary["latency"].get("improvement", 0)
        if latency_change < self.thresholds["min_latency_improvement"]:
            logger.warning(
                f"Latency improvement {latency_change:.1%} below "
                f"threshold {self.thresholds['min_latency_improvement']:.1%}"
            )
            await self.rollback("latency_degradation")
            return False

        # Check quality divergence
        divergence = summary["quality"]["mean_divergence"]
        if divergence > self.thresholds["max_divergence"]:
            logger.error(
                f"Quality divergence {divergence:.1%} exceeds "
                f"threshold {self.thresholds['max_divergence']:.1%}"
            )
            await self.rollback("quality_degradation")
            return False

        return True

    async def rollback(self, reason: str):
        """Rollback to old provider."""
        logger.critical(f"ROLLBACK initiated: {reason}")

        self.current_provider = self.old_provider
        self.migration_phase = "old"

        # Alert ops team
        await self._send_alert(
            severity="critical",
            message=f"Migration rolled back: {reason}",
            metrics=self.metrics.get_summary()
        )
```

**Automated Health Checks**:

```python
# Monitor migration health every 5 minutes
async def monitor_migration(controller: MigrationController):
    while controller.migration_phase != "new":
        await asyncio.sleep(300)  # 5 minutes

        healthy = await controller.check_health()

        if not healthy:
            logger.info("Migration rollback completed")
            break

        logger.info(
            f"Migration health check passed "
            f"(phase: {controller.migration_phase})"
        )
```


## 5. Best Practices and Trade-offs

### 5.1 Design Principles for Portable Systems

**Principle 1: Interface Segregation**

Follow the Interface Segregation Principle [Martin, 2002]: Create focused, minimal interfaces rather than monolithic ones.

```python
# ❌ Bad: Monolithic interface
class LLMProvider(ABC):
    @abstractmethod
    def complete(self, ...): pass

    @abstractmethod
    def complete_with_tools(self, ...): pass

    @abstractmethod
    def complete_with_vision(self, ...): pass

    @abstractmethod
    def embed(self, ...): pass

    @abstractmethod
    def fine_tune(self, ...): pass
    # ... 20 more methods

# ✅ Good: Segregated interfaces
class CompletionProvider(ABC):
    @abstractmethod
    def complete(self, ...): pass

class ToolProvider(ABC):
    @abstractmethod
    def complete_with_tools(self, ...): pass

class VisionProvider(ABC):
    @abstractmethod
    def complete_with_vision(self, ...): pass

class EmbeddingProvider(ABC):
    @abstractmethod
    def embed(self, ...): pass

# Providers implement only what they support
class OpenAIProvider(CompletionProvider, ToolProvider, VisionProvider):
    pass

class AnthropicProvider(CompletionProvider, ToolProvider, VisionProvider):
    pass

class CohereProvider(CompletionProvider, EmbeddingProvider):
    pass
```

**Principle 2: Dependency Inversion**

Depend on abstractions, not concretions [Martin, 2002]. Application code should never directly instantiate provider classes.

```python
# ❌ Bad: Direct dependency
class ChatService:
    def __init__(self):
        self.provider = OpenAIProvider(api_key="...")  # Concrete dependency

    async def chat(self, message: str) -> str:
        response = await self.provider.complete(...)
        return response.content

# ✅ Good: Dependency injection
class ChatService:
    def __init__(self, provider: CompletionProvider):  # Abstract dependency
        self.provider = provider

    async def chat(self, message: str) -> str:
        response = await self.provider.complete(...)
        return response.content

# Inject at runtime
provider = LLMProviderRegistry.create(ProviderType.OPENAI, ...)
service = ChatService(provider)
```

**Principle 3: Configuration Over Code**

Provider selection should be configuration-driven, not hard-coded:

```python
# ❌ Bad: Hard-coded provider logic
async def generate_response(prompt: str) -> str:
    if USE_OPENAI:
        provider = OpenAIProvider(...)
    elif USE_ANTHROPIC:
        provider = AnthropicProvider(...)
    else:
        provider = GeminiProvider(...)

    return await provider.complete(...)

# ✅ Good: Configuration-driven
async def generate_response(prompt: str, config: ContextConfig) -> str:
    provider_type = config.get_default_provider()
    provider = LLMProviderRegistry.create(provider_type, ...)
    return await provider.complete(...)
```

### 5.2 Trade-offs in Abstraction

**Trade-off 1: Generality vs. Optimization**

Generic interfaces may prevent provider-specific optimizations.

**Example**: OpenAI supports `logprobs` parameter for token probabilities, useful for confidence scoring. A generic interface may not expose this.

**Mitigation**: Use extension points:

```python
class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, messages, model, **kwargs) -> LLMResponse:
        """Complete with provider-specific kwargs."""
        pass

# Provider-specific usage
response = await openai_provider.complete(
    messages=messages,
    model="gpt-4-turbo",
    logprobs=True,  # OpenAI-specific
    top_logprobs=3
)

# Generic usage (ignores unsupported kwargs)
response = await anthropic_provider.complete(
    messages=messages,
    model="claude-3-5-sonnet",
    logprobs=True,  # Ignored gracefully
    top_logprobs=3
)
```

**Trade-off 2: Complexity vs. Portability**

More abstraction layers increase complexity. Balance portability needs with system simplicity.

**Decision Framework**:

| Scenario | Abstraction Level | Rationale |
|----------|-------------------|-----------|
| Single provider, no migration plans | **Low** (direct API usage) | Minimize complexity |
| 2-3 providers, occasional switching | **Medium** (adapter pattern) | Balance flexibility and simplicity |
| Many providers, dynamic routing | **High** (full abstraction stack) | Maximize portability |
| Provider-specific optimizations critical | **Low-Medium** (thin wrappers) | Preserve optimization access |

**Trade-off 3: Testing Overhead**

Portable systems require testing across all supported providers, multiplying test execution time.

**Mitigation**: Tiered testing strategy:

```python
# Tier 1: Fast unit tests (mock providers)
@pytest.mark.unit
async def test_context_adapter_truncation():
    mock_provider = MockLLMProvider(context_window=8192)
    adapter = ContextWindowAdapter(config)

    messages = [create_large_message(20000)]  # Exceeds window
    adapted = await adapter.adapt_context(messages, mock_provider, "gpt-4")

    assert sum(mock_provider.count_tokens(m.content, "gpt-4")
               for m in adapted) <= 7192  # Reserve 1000 tokens

# Tier 2: Integration tests (real providers, subset)
@pytest.mark.integration
@pytest.mark.parametrize("provider_type", [
    ProviderType.OPENAI,
    ProviderType.ANTHROPIC
])
async def test_provider_completion(provider_type):
    provider = LLMProviderRegistry.create(provider_type, ...)
    response = await provider.complete(...)
    assert response.content
    assert response.tokens_used > 0

# Tier 3: End-to-end tests (weekly, all providers)
@pytest.mark.e2e
@pytest.mark.slow
async def test_all_providers_quality():
    test_cases = load_quality_test_suite()

    for provider_type in LLMProviderRegistry.get_all_providers():
        provider = LLMProviderRegistry.create(provider_type, ...)

        for test_case in test_cases:
            response = await provider.complete(test_case.messages, ...)
            quality_score = evaluate_quality(response, test_case.expected)

            assert quality_score >= 0.85, \
                f"{provider_type} quality {quality_score} below threshold"
```

### 5.3 Monitoring and Observability

Portable systems require provider-agnostic monitoring:

```python
from dataclasses import dataclass
from typing import Optional
import time

@dataclass
class LLMRequestMetrics:
    """Metrics for a single LLM request."""
    request_id: str
    provider: str
    model: str
    latency_ms: float
    tokens_input: int
    tokens_output: int
    cost_usd: float
    error: Optional[str] = None
    timestamp: float = field(default_factory=time.time)

class LLMObservability:
    """Unified observability for multi-provider systems."""

    def __init__(self):
        self.metrics_backend = MetricsBackend()  # Prometheus, DataDog, etc.

    def record_request(self, metrics: LLMRequestMetrics):
        """Record request metrics."""
        # Send to metrics backend
        self.metrics_backend.increment(
            "llm.requests.total",
            tags={
                "provider": metrics.provider,
                "model": metrics.model,
                "status": "error" if metrics.error else "success"
            }
        )

        self.metrics_backend.histogram(
            "llm.latency.ms",
            metrics.latency_ms,
            tags={"provider": metrics.provider, "model": metrics.model}
        )

        self.metrics_backend.histogram(
            "llm.tokens.input",
            metrics.tokens_input,
            tags={"provider": metrics.provider}
        )

        self.metrics_backend.histogram(
            "llm.tokens.output",
            metrics.tokens_output,
            tags={"provider": metrics.provider}
        )

        self.metrics_backend.counter(
            "llm.cost.usd",
            metrics.cost_usd,
            tags={"provider": metrics.provider}
        )

    def get_provider_health(self, provider: str) -> Dict[str, float]:
        """Get health metrics for a provider."""
        return {
            "error_rate": self.metrics_backend.query(
                f"rate(llm.requests.total{{provider='{provider}',status='error'}}[5m])"
            ),
            "p50_latency": self.metrics_backend.query(
                f"histogram_quantile(0.5, llm.latency.ms{{provider='{provider}'}})"
            ),
            "p99_latency": self.metrics_backend.query(
                f"histogram_quantile(0.99, llm.latency.ms{{provider='{provider}'}})"
            ),
            "requests_per_minute": self.metrics_backend.query(
                f"rate(llm.requests.total{{provider='{provider}'}}[1m]) * 60"
            ),
        }
```

**Grafana Dashboard Query Examples**:

```promql
# Compare latency across providers
histogram_quantile(0.95,
  rate(llm_latency_ms_bucket[5m])
) by (provider)

# Track cost by provider
sum by (provider) (
  rate(llm_cost_usd_total[1h])
) * 3600

# Error rate by provider and model
sum by (provider, model) (
  rate(llm_requests_total{status="error"}[5m])
) /
sum by (provider, model) (
  rate(llm_requests_total[5m])
)
```

[VISUAL: Grafana dashboard mockup showing multi-provider metrics: latency distributions, cost breakdown, error rates, and traffic distribution]


## Key Takeaways

1. **Abstraction is Essential**: The Adapter pattern isolates provider-specific logic, enabling seamless switching between OpenAI, Anthropic, Gemini, and other providers while maintaining consistent application code.

2. **Token Normalization Matters**: Different tokenization schemes across providers require character-based estimation with provider-specific calibration. Budget 10-15% variance in token counts when switching providers.


![Token Normalization Across Providers](/images/context-engineering/blog10_concept03_token_normalization.png)
*Figure: Token Normalization Across Providers* — Visualization showing same text tokenized by different providers: GPT-4 (13,500 tokens), Claude 3.5 (15,200 tokens), Gemini (12,800 tokens), with tokens-per-character ratios and calibration curves


3. **Feature Compatibility Varies**: Not all providers support all features (tool calling, vision, JSON mode). Use feature flags and smart routing to match requests to compatible providers automatically.

4. **Migration Requires Rigor**: Use the dual-write pattern with shadow testing for 2+ weeks before cutover. Automate health checks and rollback triggers to prevent migration-induced outages.

5. **Trade-offs Are Unavoidable**: Balance abstraction complexity against provider-specific optimization access. Choose abstraction level based on your multi-provider needs: single provider → low abstraction; many providers → high abstraction.

**Quick Reference**: See [Multi-Provider Architecture Decision Record](./adr-multiproviderd.md) for detailed trade-off analysis.


## Next Steps

**Immediate Actions**:
- [ ] Audit your current system for provider-specific dependencies (search for direct API calls)
- [ ] Implement the `LLMProvider` abstract base class with adapters for your current providers
- [ ] Create a provider registry and externalize provider selection to configuration files
- [ ] Set up monitoring for provider-specific metrics (latency, cost, errors) to establish baselines

**Continue Learning**:
- **Blog 9: Production Deployment** - Infrastructure patterns for resilient multi-provider deployments including circuit breakers, rate limiting, and cost tracking
- **Blog 4: MCP Fundamentals** - The Model Context Protocol provides another abstraction layer for tool integration that complements provider abstraction
- **Blog 11: Case Studies** - Real-world examples of organizations successfully operating multi-provider LLM infrastructures

**Additional Resources**:
- [LangChain Model I/O Abstraction](https://python.langchain.com/docs/modules/model_io/) - Open-source implementation of provider abstraction
- [LiteLLM](https://github.com/BerriAI/litellm) - Unified API across 100+ LLM providers
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference) - Official OpenAI API documentation
- [Anthropic API Reference](https://docs.anthropic.com/claude/reference) - Official Anthropic Claude API documentation


## References

### Research Papers

Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley Professional.

Martin, R. C. (2002). *Agile Software Development, Principles, Patterns, and Practices*. Prentice Hall.

Radford, A., Wu, J., Child, R., Luan, D., Amodei, D., & Sutskever, I. (2019). "Language Models are Unsupervised Multitask Learners." *OpenAI Technical Report*.

### Official Documentation

Anthropic (2024). "Claude API Reference." https://docs.anthropic.com/claude/reference. Accessed: 2025-12-08

OpenAI (2024). "OpenAI API Reference." https://platform.openai.com/docs/api-reference. Accessed: 2025-12-08

Google (2024). "Gemini API Documentation." https://ai.google.dev/docs. Accessed: 2025-12-08

Cohere (2024). "Cohere API Documentation." https://docs.cohere.com/. Accessed: 2025-12-08

### Books

Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code* (2nd Edition). Addison-Wesley Professional.

Newman, S. (2021). *Building Microservices* (2nd Edition). O'Reilly Media.

### Articles

Morris, J. X. et al. (2023). "Language Model Tokenization: Impacts on Semantic Similarity and Search." *arXiv:2304.09840*.


**About This Series**: This blog is part of a comprehensive 12-part series on Context Engineering. See [Series Overview](./00-series-overview.md) for the complete guide.

**Previous**: Blog 9: Production Deployment - Infrastructure and Reliability Patterns
**Next**: Blog 11: Case Studies - Real-World Context Engineering Applications
