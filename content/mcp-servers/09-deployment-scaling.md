---
title: "MCP Production Deployment: Scaling and Operations"
subtitle: "Enterprise-grade deployment patterns for Model Context Protocol servers"
date: 2024-01-09
author: "MCP DevOps Team"
tags: ["deployment", "kubernetes", "docker", "scaling", "monitoring", "production", "devops"]
difficulty: "intermediate"
readTime: "18 min"
---

# MCP Production Deployment: Scaling and Operations

Moving Model Context Protocol (MCP) servers from development to production requires careful consideration of deployment architecture, scaling strategies, and operational excellence. This comprehensive guide covers production-ready deployment patterns, containerization strategies, orchestration with Kubernetes, and monitoring approaches for MCP servers at scale.

## Table of Contents

1. [Production Architecture Overview](#production-architecture-overview)
2. [Containerization Strategies](#containerization-strategies)
3. [HTTP Transport for Production](#http-transport-for-production)
4. [Kubernetes Deployment Patterns](#kubernetes-deployment-patterns)
5. [Load Balancing and Scaling](#load-balancing-and-scaling)
6. [Monitoring and Observability](#monitoring-and-observability)
7. [Logging and Error Handling](#logging-and-error-handling)
8. [CI/CD Pipeline Design](#cicd-pipeline-design)
9. [Security and Authentication](#security-and-authentication)
10. [Production Operations](#production-operations)

## Production Architecture Overview

### Architecture Patterns

MCP servers in production typically follow one of three architectural patterns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Pattern 1: Stateless                      │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Client  │───▶│   LB     │───▶│  MCP Pod │              │
│  └──────────┘    └──────────┘    ├──────────┤              │
│                                   │  MCP Pod │              │
│                                   ├──────────┤              │
│                                   │  MCP Pod │              │
│                                   └──────────┘              │
│                                                              │
│  ✓ Horizontal scaling            ✓ Session per request     │
│  ✓ Simple load balancing         ✓ No state management     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Pattern 2: Stateful                       │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐      │
│  │  Client  │───▶│  Session │───▶│  MCP Pod (sticky)│      │
│  └──────────┘    │  Router  │    └──────────────────┘      │
│                  └──────────┘    ┌──────────────────┐      │
│                                  │  MCP Pod (sticky)│      │
│                                  └──────────────────┘      │
│                                                              │
│  ✓ Session persistence          ✓ Resource subscriptions   │
│  ✓ Connection reuse              ✓ State management         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Pattern 3: Hybrid                         │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐      │
│  │  Client  │───▶│   LB     │───▶│ Stateless Pods   │      │
│  └──────────┘    └──────────┘    └──────────────────┘      │
│                       │                                      │
│                       └──────────▶┌──────────────────┐      │
│                                   │ Stateful Pods    │      │
│                                   │ (resources only) │      │
│                                   └──────────────────┘      │
│                                                              │
│  ✓ Mixed workloads               ✓ Optimized resource use  │
│  ✓ Complex routing               ✓ Advanced features        │
└─────────────────────────────────────────────────────────────┘
```

**Pattern Selection Guide:**

- **Stateless Pattern**: Use for simple tools/prompts with no subscriptions, maximum horizontal scalability
- **Stateful Pattern**: Use for resource subscriptions, long-running tasks, session-dependent features
- **Hybrid Pattern**: Use for complex deployments mixing stateless operations with stateful resources

### Transport Selection for Production

According to the [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports), production deployments should use **Streamable HTTP** transport:

```python
"""
Production-ready MCP server with Streamable HTTP transport
Source: Model Context Protocol Python SDK
"""
from mcp.server.fastmcp import FastMCP

# Production server with FastMCP
mcp = FastMCP("ProductionServer")

@mcp.tool()
def production_tool(param: str) -> str:
    """Production-ready tool example."""
    return f"Processing: {param}"

if __name__ == "__main__":
    # Run with default stdio transport
    # For HTTP deployment, mount to FastAPI/Starlette (see HTTP Transport section)
    mcp.run()
    # Stdio transport for production process management
```

**Key Benefits:**
- Works with standard HTTP load balancers
- Supports both stateless (JSON) and stateful (SSE) modes
- Compatible with cloud-native infrastructure
- Built-in session management and resumability

## Containerization Strategies

### Multi-Stage Docker Build

Create optimized container images with multi-stage builds:

```dockerfile
# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install uv and dependencies
RUN pip install uv
RUN uv sync --frozen

# Stage 2: Production image
FROM python:3.11-slim

WORKDIR /app

# Copy only runtime dependencies from builder
COPY --from=builder /build/.venv /app/.venv

# Copy application code
COPY src/ /app/src/
COPY server.py /app/

# Create non-root user for security
RUN useradd -m -u 1000 mcpuser && \
    chown -R mcpuser:mcpuser /app

USER mcpuser

# Environment configuration
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    MCP_PORT=8000 \
    MCP_HOST=0.0.0.0

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Expose MCP port
EXPOSE 8000

# Run server
CMD ["python", "server.py"]
```

### Dependency Management

Declare dependencies for proper containerization (from [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
from mcp.server.fastmcp import FastMCP

# NOTE: Dependencies should be declared in pyproject.toml or requirements.txt
# FastMCP does not accept a dependencies parameter in its constructor

mcp = FastMCP("Production Server")

@mcp.tool()
def process_data(data: list[float]) -> dict:
    """Process data using numpy."""
    import numpy as np  # Ensure numpy is in pyproject.toml
    arr = np.array(data)
    return {
        "mean": float(np.mean(arr)),
        "std": float(np.std(arr)),
        "max": float(np.max(arr))
    }

if __name__ == "__main__":
    # Run with default stdio transport
    mcp.run()
```

### Docker Compose for Local Testing

Test production configurations locally:

```yaml
# docker-compose.yml
version: '3.8'

services:
  mcp-server:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - MCP_LOG_LEVEL=info
    volumes:
      - ./config:/app/config:ro
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - mcp-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards:ro
    networks:
      - mcp-network
    restart: unless-stopped

networks:
  mcp-network:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
```

## HTTP Transport for Production

### Streamable HTTP Configuration

Configure production-ready HTTP transport (from [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)):

```python
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from starlette.routing import Mount
from starlette.middleware.cors import CORSMiddleware
import contextlib

# Create stateful server (maintains session state)
mcp = FastMCP("Weather Service")

@mcp.tool()
def get_weather(city: str) -> str:
    """Get weather for a city."""
    return f"Weather in {city}: Sunny, 22°C"

# Option 1: Run directly with streamable-http transport
if __name__ == "__main__":
    mcp.run()  # Default stdio transport
    # Server runs at http://localhost:8000/mcp

# Option 2: Mount to existing Starlette app
mcp_stateless = FastMCP("Stateless Service")

@mcp_stateless.tool()
def echo(message: str) -> str:
    return f"Echo: {message}"

# Combine multiple servers in one app
@contextlib.asynccontextmanager
async def lifespan(app: Starlette):
    async with contextlib.AsyncExitStack() as stack:
        await stack.enter_async_context(mcp.session_manager.run())
        await stack.enter_async_context(mcp_stateless.session_manager.run())
        yield

app = Starlette(
    routes=[
        Mount("/weather", mcp.streamable_http_app()),
        Mount("/echo", mcp_stateless.streamable_http_app())
    ],
    lifespan=lifespan
)

# Add CORS for browser clients
app = CORSMiddleware(
    app,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "DELETE"],
    expose_headers=["Mcp-Session-Id"]  # Required for session management
)

# Run with: uvicorn server:app --reload
# Clients connect to http://localhost:8000/weather/mcp
```

### Connection Resumability

Implement connection resumability for production reliability (from [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)):

**Server-side event ID attachment:**
```python
# Servers MAY attach a unique 'id' field to SSE events
# Event IDs MUST be globally unique across streams
# Event IDs SHOULD encode stream identification

# Example SSE event with ID:
# id: stream-abc-123-msg-001
# event: message
# data: {"jsonrpc": "2.0", "method": "tools/list", ...}
```

**Client-side connection resumption:**
```python
import httpx

# To resume after disconnection:
# 1. Issue HTTP GET to MCP endpoint
# 2. Include Last-Event-ID header

async with httpx.AsyncClient() as client:
    headers = {
        "Accept": "text/event-stream",
        "Last-Event-ID": "stream-abc-123-msg-001"  # Last received event ID
    }

    async with client.stream("GET", "http://server/mcp", headers=headers) as response:
        # Server MAY replay messages from that point
        # Server MUST NOT replay messages from different streams
        async for line in response.aiter_lines():
            process_sse_event(line)
```

**Benefits:**
- Automatic recovery from network interruptions
- No message loss during brief disconnections
- Transparent to application logic

## Kubernetes Deployment Patterns

### Stateless Deployment

Deploy stateless MCP servers for maximum scalability:

```yaml
# mcp-stateless-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server-stateless
  namespace: mcp-production
  labels:
    app: mcp-server
    tier: stateless
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  selector:
    matchLabels:
      app: mcp-server
      tier: stateless
  template:
    metadata:
      labels:
        app: mcp-server
        tier: stateless
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: mcp-server
        image: your-registry/mcp-server:v1.2.3
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8000
          name: http
          protocol: TCP
        env:
        - name: MCP_LOG_LEVEL
          value: "info"
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 2
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - mcp-server
              topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-server-stateless
  namespace: mcp-production
spec:
  type: ClusterIP
  selector:
    app: mcp-server
    tier: stateless
  ports:
  - port: 80
    targetPort: 8000
    protocol: TCP
    name: http
  sessionAffinity: None  # No sticky sessions for stateless
```

### Stateful Deployment with Session Persistence

Deploy stateful MCP servers for resource subscriptions:

```yaml
# mcp-stateful-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mcp-server-stateful
  namespace: mcp-production
spec:
  serviceName: mcp-server-stateful
  replicas: 3
  podManagementPolicy: Parallel
  selector:
    matchLabels:
      app: mcp-server
      tier: stateful
  template:
    metadata:
      labels:
        app: mcp-server
        tier: stateful
    spec:
      containers:
      - name: mcp-server
        image: your-registry/mcp-server:v1.2.3
        ports:
        - containerPort: 8000
          name: http
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        resources:
          requests:
            cpu: 300m
            memory: 512Mi
          limits:
            cpu: 2000m
            memory: 1Gi
        volumeMounts:
        - name: session-data
          mountPath: /app/sessions
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 15
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
  volumeClaimTemplates:
  - metadata:
      name: session-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-server-stateful
  namespace: mcp-production
spec:
  type: ClusterIP
  clusterIP: None  # Headless service for StatefulSet
  selector:
    app: mcp-server
    tier: stateful
  ports:
  - port: 8000
    targetPort: 8000
    protocol: TCP
    name: http
  sessionAffinity: ClientIP  # Enable sticky sessions
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600  # 1 hour session timeout
```

### Horizontal Pod Autoscaler

Scale MCP servers based on metrics:

```yaml
# mcp-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mcp-server-hpa
  namespace: mcp-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mcp-server-stateless
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: mcp_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0  # Scale up immediately
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 4
        periodSeconds: 30
      selectPolicy: Max
```

## Load Balancing and Scaling

### Ingress Configuration

Configure ingress for production traffic:

```yaml
# mcp-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mcp-server-ingress
  namespace: mcp-production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    # Enable session affinity for stateful endpoints
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "mcp-session"
    nginx.ingress.kubernetes.io/session-cookie-max-age: "3600"
    # Rate limiting
    nginx.ingress.kubernetes.io/limit-rps: "100"
    nginx.ingress.kubernetes.io/limit-connections: "50"
spec:
  tls:
  - hosts:
    - mcp.example.com
    secretName: mcp-tls-cert
  rules:
  - host: mcp.example.com
    http:
      paths:
      # Stateless endpoints - round-robin
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: mcp-server-stateless
            port:
              number: 80
      # Stateful endpoints - sticky sessions
      - path: /stream
        pathType: Prefix
        backend:
          service:
            name: mcp-server-stateful
            port:
              number: 8000
```

### Load Balancing Strategies

**For Stateless Deployments:**
```yaml
# nginx-lb-stateless.conf
upstream mcp_stateless {
    least_conn;  # Route to least loaded server

    server mcp-pod-1:8000 max_fails=3 fail_timeout=30s;
    server mcp-pod-2:8000 max_fails=3 fail_timeout=30s;
    server mcp-pod-3:8000 max_fails=3 fail_timeout=30s;

    keepalive 32;
}

server {
    listen 80;
    server_name mcp.example.com;

    location /api {
        proxy_pass http://mcp_stateless;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**For Stateful Deployments:**
```yaml
# nginx-lb-stateful.conf
upstream mcp_stateful {
    ip_hash;  # Consistent routing based on client IP

    server mcp-stateful-0:8000 max_fails=3 fail_timeout=30s;
    server mcp-stateful-1:8000 max_fails=3 fail_timeout=30s;
    server mcp-stateful-2:8000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name mcp.example.com;

    location /stream {
        proxy_pass http://mcp_stateful;
        proxy_http_version 1.1;

        # SSE-specific headers
        proxy_set_header Connection "";
        proxy_set_header Cache-Control "no-cache";
        proxy_set_header X-Accel-Buffering "no";

        # Extended timeouts for long-lived connections
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

## Monitoring and Observability

### Prometheus Metrics

Implement comprehensive metrics collection:

```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server
from mcp.server.fastmcp import FastMCP
import time

# Define metrics
request_counter = Counter(
    'mcp_requests_total',
    'Total MCP requests',
    ['method', 'status']
)

request_duration = Histogram(
    'mcp_request_duration_seconds',
    'Request duration in seconds',
    ['method'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0]
)

active_sessions = Gauge(
    'mcp_active_sessions',
    'Number of active MCP sessions'
)

tool_executions = Counter(
    'mcp_tool_executions_total',
    'Total tool executions',
    ['tool_name', 'status']
)

error_counter = Counter(
    'mcp_errors_total',
    'Total errors',
    ['error_type']
)

mcp = FastMCP("Monitored Server")

@mcp.tool()
async def monitored_tool(param: str) -> str:
    """Tool with monitoring."""
    start_time = time.time()

    try:
        # Increment active sessions
        active_sessions.inc()

        # Your tool logic here
        result = f"Processed: {param}"

        # Record success metrics
        tool_executions.labels(tool_name='monitored_tool', status='success').inc()
        request_counter.labels(method='tool_call', status='success').inc()

        return result

    except Exception as e:
        # Record error metrics
        tool_executions.labels(tool_name='monitored_tool', status='error').inc()
        error_counter.labels(error_type=type(e).__name__).inc()
        raise

    finally:
        # Record duration and decrement active sessions
        duration = time.time() - start_time
        request_duration.labels(method='tool_call').observe(duration)
        active_sessions.dec()

if __name__ == "__main__":
    # Start Prometheus metrics server
    start_http_server(9090)

    # Run MCP server
    mcp.run()  # Default stdio transport
```

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mcp-servers'
    kubernetes_sd_configs:
    - role: pod
      namespaces:
        names:
        - mcp-production
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
      action: replace
      regex: ([^:]+)(?::\d+)?;(\d+)
      replacement: $1:$2
      target_label: __address__
    - source_labels: [__meta_kubernetes_namespace]
      action: replace
      target_label: kubernetes_namespace
    - source_labels: [__meta_kubernetes_pod_name]
      action: replace
      target_label: kubernetes_pod_name

  - job_name: 'mcp-endpoints'
    static_configs:
    - targets:
      - mcp-server-1:9090
      - mcp-server-2:9090
      - mcp-server-3:9090
      labels:
        environment: production
        service: mcp-server
```

### Grafana Dashboard

Create comprehensive monitoring dashboards:

```json
{
  "dashboard": {
    "title": "MCP Server Production Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(mcp_requests_total[5m])",
          "legendFormat": "{{method}} - {{status}}"
        }],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "title": "Request Duration (p95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(mcp_request_duration_seconds_bucket[5m]))",
          "legendFormat": "{{method}}"
        }],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "title": "Active Sessions",
        "targets": [{
          "expr": "mcp_active_sessions"
        }],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(mcp_errors_total[5m])",
          "legendFormat": "{{error_type}}"
        }],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      },
      {
        "title": "Tool Execution Success Rate",
        "targets": [{
          "expr": "rate(mcp_tool_executions_total{status='success'}[5m]) / rate(mcp_tool_executions_total[5m])",
          "legendFormat": "{{tool_name}}"
        }],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 16}
      }
    ]
  }
}
```

## Logging and Error Handling

### Structured Logging

Implement production-grade logging (from [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
import logging
import json
from datetime import datetime
from mcp.server.fastmcp import FastMCP

# Configure structured JSON logging
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        if hasattr(record, 'user_id'):
            log_data["user_id"] = record.user_id

        if hasattr(record, 'request_id'):
            log_data["request_id"] = record.request_id

        return json.dumps(log_data)

# Setup logger
logger = logging.getLogger("mcp_server")
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)

mcp = FastMCP("Production Server")

@mcp.tool()
async def production_tool(data: str) -> str:
    """Tool with comprehensive logging."""

    try:
        # Process data
        result = process_data(data)

        logger.info(
            "Tool execution completed",
            extra={
                "tool_name": "production_tool",
                "data_size": len(data),
                "success": True
            }
        )

        return result

    except ValueError as e:
        logger.warning(
            "Tool execution warning",
            extra={"tool_name": "production_tool", "error": str(e)}
        )
        raise

    except Exception as e:
        logger.exception(
            "Tool execution failed",
            extra={"tool_name": "production_tool"}
        )
        raise

def process_data(data: str) -> str:
    """Data processing logic."""
    if not data:
        raise ValueError("Empty data provided")
    return f"Processed: {data}"
```

### Error Handling Patterns

Implement robust error handling (from [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)):

```python
from mcp.shared.exceptions import McpError
from mcp.types import CallToolResult, TextContent
import logging

logger = logging.getLogger(__name__)

async def robust_tool_handler(tool_name: str, args: dict) -> CallToolResult:
    """Robust error handling for tool execution."""

    try:
        # Execute tool
        result = await execute_tool(tool_name, args)

        return CallToolResult(
            content=[TextContent(type="text", text=result)]
        )

    except McpError as e:
        # MCP-specific errors
        logger.error(f"MCP error in {tool_name}: {e.error.message}")
        return CallToolResult(
            content=[TextContent(type="text", text=f"MCP Error: {e.error.message}")],
            isError=True
        )

    except ValueError as e:
        # Validation errors
        logger.warning(f"Validation error in {tool_name}: {e}")
        return CallToolResult(
            content=[TextContent(type="text", text=f"Invalid input: {e}")],
            isError=True
        )

    except (ConnectionError, TimeoutError) as e:
        # Network errors
        logger.error(f"Network error in {tool_name}: {e}")
        return CallToolResult(
            content=[TextContent(type="text", text="Service temporarily unavailable")],
            isError=True
        )

    except Exception as e:
        # Catch-all for unexpected errors
        logger.exception(f"Unexpected error in {tool_name}")
        return CallToolResult(
            content=[TextContent(type="text", text="Internal server error")],
            isError=True
        )

async def execute_tool(tool_name: str, args: dict) -> str:
    """Tool execution logic."""
    # Implementation here
    return f"Executed {tool_name} with {args}"
```

### Log Aggregation

Configure log shipping to centralized systems:

```yaml
# fluent-bit-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: mcp-production
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush        5
        Daemon       Off
        Log_Level    info
        Parsers_File parsers.conf

    [INPUT]
        Name              tail
        Path              /var/log/containers/mcp-server*.log
        Parser            docker
        Tag               mcp.*
        Refresh_Interval  5
        Mem_Buf_Limit     5MB
        Skip_Long_Lines   On

    [FILTER]
        Name                parser
        Match               mcp.*
        Key_Name            log
        Parser              json
        Reserve_Data        True

    [OUTPUT]
        Name   es
        Match  mcp.*
        Host   elasticsearch.logging.svc.cluster.local
        Port   9200
        Index  mcp-logs
        Type   _doc

  parsers.conf: |
    [PARSER]
        Name   json
        Format json
        Time_Key timestamp
        Time_Format %Y-%m-%dT%H:%M:%S.%LZ
```

## CI/CD Pipeline Design

### GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy-staging
  - deploy-production

variables:
  DOCKER_REGISTRY: registry.example.com
  IMAGE_NAME: mcp-server
  KUBERNETES_VERSION: "1.28"

test:
  stage: test
  image: python:3.11
  before_script:
    - pip install uv
    - uv sync --frozen
  script:
    - uv run pytest tests/ -v --cov=src --cov-report=term --cov-report=xml
    - uv run mypy src/
    - uv run ruff check src/
  coverage: '/TOTAL.*\s+(\d+%)$/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $DOCKER_REGISTRY
  script:
    - |
      docker build \
        --build-arg VERSION=$CI_COMMIT_SHORT_SHA \
        --tag $DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHORT_SHA \
        --tag $DOCKER_REGISTRY/$IMAGE_NAME:latest \
        .
    - docker push $DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHORT_SHA
    - docker push $DOCKER_REGISTRY/$IMAGE_NAME:latest
  only:
    - main
    - tags

deploy-staging:
  stage: deploy-staging
  image: bitnami/kubectl:$KUBERNETES_VERSION
  script:
    - kubectl config use-context staging
    - |
      kubectl set image deployment/mcp-server \
        mcp-server=$DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHORT_SHA \
        -n mcp-staging
    - kubectl rollout status deployment/mcp-server -n mcp-staging --timeout=5m
  environment:
    name: staging
    url: https://mcp-staging.example.com
  only:
    - main

deploy-production:
  stage: deploy-production
  image: bitnami/kubectl:$KUBERNETES_VERSION
  script:
    - kubectl config use-context production
    - |
      kubectl set image deployment/mcp-server \
        mcp-server=$DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHORT_SHA \
        -n mcp-production
    - kubectl rollout status deployment/mcp-server -n mcp-production --timeout=10m
  environment:
    name: production
    url: https://mcp.example.com
  when: manual
  only:
    - tags
```

### GitHub Actions Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy MCP Server

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install uv
          uv sync --frozen

      - name: Run tests
        run: |
          uv run pytest tests/ -v --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://mcp-staging.example.com
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

      - name: Deploy to staging
        run: |
          kubectl set image deployment/mcp-server \
            mcp-server=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }} \
            -n mcp-staging
          kubectl rollout status deployment/mcp-server -n mcp-staging --timeout=5m

  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    environment:
      name: production
      url: https://mcp.example.com
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}

      - name: Deploy to production
        run: |
          kubectl set image deployment/mcp-server \
            mcp-server=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }} \
            -n mcp-production
          kubectl rollout status deployment/mcp-server -n mcp-production --timeout=10m
```

## Security and Authentication

### OAuth2 Bearer Token Authentication

Implement OAuth2 authentication for HTTP transport:

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from mcp.server.fastmcp import FastMCP

# OAuth2 configuration
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict):
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def verify_token(token: str = Depends(oauth2_scheme)):
    """Verify JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception

# Create FastAPI app with authentication
app = FastAPI()
mcp = FastMCP("Secure Server")

@mcp.tool()
def secure_operation(param: str) -> str:
    """Authenticated operation."""
    return f"Secure result: {param}"

# Mount MCP with authentication
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.authentication import (
    AuthenticationBackend, AuthCredentials, SimpleUser
)

class BearerTokenAuthBackend(AuthenticationBackend):
    async def authenticate(self, request):
        if "Authorization" not in request.headers:
            return None

        auth = request.headers["Authorization"]
        try:
            scheme, token = auth.split()
            if scheme.lower() != 'bearer':
                return None
            username = await verify_token(token)
            return AuthCredentials(["authenticated"]), SimpleUser(username)
        except Exception:
            return None

app.add_middleware(AuthenticationMiddleware, backend=BearerTokenAuthBackend())
app.mount("/mcp", mcp.streamable_http_app())
```

### API Key Authentication

Simpler API key-based authentication:

```python
from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader
from starlette.status import HTTP_403_FORBIDDEN

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# In production, load from secure key management service
VALID_API_KEYS = {
    "key-12345": {"client": "service-a", "rate_limit": 1000},
    "key-67890": {"client": "service-b", "rate_limit": 500},
}

async def verify_api_key(api_key: str = Security(api_key_header)):
    """Verify API key."""
    if api_key not in VALID_API_KEYS:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )
    return VALID_API_KEYS[api_key]

@app.middleware("http")
async def add_api_key_check(request, call_next):
    """Middleware to check API keys."""
    if request.url.path.startswith("/mcp"):
        api_key = request.headers.get(API_KEY_NAME)
        if not api_key or api_key not in VALID_API_KEYS:
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid or missing API key"}
            )
    response = await call_next(request)
    return response
```

## Production Operations

### Health Check Implementation

Implement comprehensive health checks:

```python
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from mcp.server.fastmcp import FastMCP
import asyncio
import psutil
import time

app = FastAPI()
mcp = FastMCP("Production Server")

# Track server startup time
startup_time = time.time()

@app.get("/health")
async def health_check():
    """Liveness probe - checks if server is running."""
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/ready")
async def readiness_check():
    """Readiness probe - checks if server can handle requests."""
    checks = {
        "server": await check_server_ready(),
        "dependencies": await check_dependencies(),
        "resources": await check_resources()
    }

    all_ready = all(checks.values())
    status_code = status.HTTP_200_OK if all_ready else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "ready": all_ready,
            "checks": checks,
            "uptime": time.time() - startup_time
        }
    )

async def check_server_ready() -> bool:
    """Check if MCP server is initialized."""
    try:
        # Verify server can respond
        return True
    except Exception:
        return False

async def check_dependencies() -> bool:
    """Check external dependencies."""
    try:
        # Check database, external APIs, etc.
        # Example: await db.ping()
        return True
    except Exception:
        return False

async def check_resources() -> bool:
    """Check system resources."""
    memory_percent = psutil.virtual_memory().percent
    cpu_percent = psutil.cpu_percent(interval=1)

    # Fail if resources critically low
    return memory_percent < 90 and cpu_percent < 90

app.mount("/mcp", mcp.streamable_http_app())
```

### Graceful Shutdown

Implement graceful shutdown handling:

```python
import signal
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP

shutdown_event = asyncio.Event()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    # Startup
    print("Starting MCP server...")

    # Register signal handlers
    signal.signal(signal.SIGTERM, lambda s, f: shutdown_event.set())
    signal.signal(signal.SIGINT, lambda s, f: shutdown_event.set())

    yield

    # Shutdown
    print("Shutting down gracefully...")

    # Wait for in-flight requests (max 30 seconds)
    try:
        await asyncio.wait_for(
            wait_for_requests_complete(),
            timeout=30.0
        )
    except asyncio.TimeoutError:
        print("Shutdown timeout - forcing shutdown")

    print("Shutdown complete")

async def wait_for_requests_complete():
    """Wait for all in-flight requests to complete."""
    while active_requests > 0:
        await asyncio.sleep(0.1)

app = FastAPI(lifespan=lifespan)
mcp = FastMCP("Graceful Server")

# Track active requests
active_requests = 0

@app.middleware("http")
async def track_requests(request, call_next):
    """Track active requests for graceful shutdown."""
    global active_requests

    active_requests += 1
    try:
        response = await call_next(request)
        return response
    finally:
        active_requests -= 1

app.mount("/mcp", mcp.streamable_http_app())
```

### Backup and Disaster Recovery

Implement backup strategies for stateful deployments:

```yaml
# backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mcp-backup
  namespace: mcp-production
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: backup
            image: your-registry/backup-tool:latest
            env:
            - name: BACKUP_TARGET
              value: "s3://backup-bucket/mcp-production"
            - name: RETENTION_DAYS
              value: "30"
            volumeMounts:
            - name: session-data
              mountPath: /data
              readOnly: true
            command:
            - /bin/sh
            - -c
            - |
              #!/bin/sh
              TIMESTAMP=$(date +%Y%m%d-%H%M%S)
              tar czf /tmp/backup-${TIMESTAMP}.tar.gz /data
              aws s3 cp /tmp/backup-${TIMESTAMP}.tar.gz ${BACKUP_TARGET}/
              aws s3 ls ${BACKUP_TARGET}/ | \
                head -n -${RETENTION_DAYS} | \
                awk '{print $4}' | \
                xargs -I {} aws s3 rm ${BACKUP_TARGET}/{}
          volumes:
          - name: session-data
            persistentVolumeClaim:
              claimName: mcp-session-data
```

## Visual Concepts

### Deployment Architecture Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                      Production Architecture                   │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐                                             │
│  │   Clients    │                                             │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │   Ingress    │  (TLS, Rate Limiting, Auth)                │
│  │   (NGINX)    │                                             │
│  └──────┬───────┘                                             │
│         │                                                      │
│    ┌────┴────┐                                                │
│    │         │                                                │
│    ▼         ▼                                                │
│  ┌─────┐   ┌─────────────┐                                   │
│  │ LB  │   │ Session LB  │                                   │
│  └──┬──┘   └──────┬──────┘                                   │
│     │             │                                            │
│     │             │                                            │
│     ▼             ▼                                            │
│  ┌──────────────────────────────────────┐                    │
│  │        Kubernetes Cluster             │                    │
│  │                                        │                    │
│  │  ┌─────────────┐  ┌──────────────┐   │                    │
│  │  │  Stateless  │  │  Stateful    │   │                    │
│  │  │  Pods (5)   │  │  StatefulSet │   │                    │
│  │  │  HPA: 3-20  │  │  Pods (3)    │   │                    │
│  │  └─────────────┘  └──────────────┘   │                    │
│  │                                        │                    │
│  └────────────┬───────────────────┬──────┘                    │
│               │                   │                            │
│               ▼                   ▼                            │
│        ┌──────────┐        ┌──────────┐                      │
│        │Prometheus│        │  Logs    │                      │
│        │  + Graf  │        │ (Fluent) │                      │
│        └──────────┘        └──────────┘                      │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### Scaling Pattern Visualization

```
Request Load vs. Pod Count

  Pods │                              ╱─────
   20  │                          ╱───
       │                      ╱───
   15  │                  ╱───
       │              ╱───
   10  │          ╱───
       │      ╱───
    5  │  ╱───
       │──
    3  │──────────────
       └─────────────────────────────────────▶ Time
           │          │          │
         Low        Medium     High
        Traffic     Traffic   Traffic

       ├─ Baseline ─┤── Scale Up ──┤─ Max ─┤
```

### Monitoring Stack Diagram

```
┌──────────────────────────────────────────────────────────┐
│                   Monitoring Stack                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  MCP Pods                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐                       │
│  │ Metrics│ │ Metrics│ │ Metrics│                       │
│  │  :9090 │ │  :9090 │ │  :9090 │                       │
│  └───┬────┘ └───┬────┘ └───┬────┘                       │
│      │          │          │                              │
│      └──────────┴──────────┘                              │
│                 │                                          │
│                 ▼                                          │
│          ┌─────────────┐                                  │
│          │ Prometheus  │◀── Scrape every 15s             │
│          │  (TSDB)     │                                  │
│          └──────┬──────┘                                  │
│                 │                                          │
│                 ▼                                          │
│          ┌─────────────┐                                  │
│          │  Grafana    │◀── Dashboards + Alerts          │
│          │ (Visualize) │                                  │
│          └─────────────┘                                  │
│                                                           │
│  Logs                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐                       │
│  │ stdout │ │ stdout │ │ stdout │                       │
│  └───┬────┘ └───┬────┘ └───┬────┘                       │
│      │          │          │                              │
│      └──────────┴──────────┘                              │
│                 │                                          │
│                 ▼                                          │
│          ┌─────────────┐                                  │
│          │ Fluent Bit  │                                  │
│          └──────┬──────┘                                  │
│                 │                                          │
│                 ▼                                          │
│          ┌─────────────┐                                  │
│          │Elasticsearch│                                  │
│          └──────┬──────┘                                  │
│                 │                                          │
│                 ▼                                          │
│          ┌─────────────┐                                  │
│          │   Kibana    │◀── Log Search + Analysis        │
│          └─────────────┘                                  │
└──────────────────────────────────────────────────────────┘
```

## Production Checklist

Before deploying to production, verify:

**Infrastructure:**
- [ ] Kubernetes cluster sized appropriately
- [ ] Load balancers configured with health checks
- [ ] TLS certificates valid and auto-renewing
- [ ] DNS records pointing to correct endpoints
- [ ] Firewall rules restricting access appropriately

**Application:**
- [ ] Environment variables configured securely
- [ ] Dependencies declared and validated
- [ ] Health/readiness endpoints implemented
- [ ] Graceful shutdown handling implemented
- [ ] Resource limits set appropriately

**Monitoring:**
- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards created
- [ ] Alerting rules configured
- [ ] Log aggregation working
- [ ] Error tracking integrated

**Security:**
- [ ] Authentication enabled
- [ ] API keys rotated regularly
- [ ] Secrets stored in vault/secrets manager
- [ ] RBAC policies configured
- [ ] Network policies applied

**Operations:**
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Runbooks created for common issues
- [ ] On-call rotation established
- [ ] Incident response process defined

**Performance:**
- [ ] Load testing completed
- [ ] Auto-scaling tested and tuned
- [ ] Resource usage optimized
- [ ] Connection pooling configured
- [ ] Caching strategy implemented

## Conclusion

Production deployment of MCP servers requires careful planning across containerization, orchestration, monitoring, and operations. Key takeaways:

1. **Choose the right architecture pattern** - Stateless for scalability, stateful for advanced features, hybrid for complex needs
2. **Use Streamable HTTP transport** - Production-ready with session management and resumability
3. **Implement comprehensive monitoring** - Metrics, logs, and traces for complete observability
4. **Automate everything** - CI/CD pipelines, scaling, backups, and recovery
5. **Prioritize security** - Authentication, encryption, and access controls at every layer
6. **Plan for failures** - Health checks, graceful shutdown, and disaster recovery

With these patterns in place, your MCP servers will run reliably at scale, serving production workloads with confidence.

## Additional Resources

- [MCP Specification - Transports](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [Microsoft MCP Servers](https://github.com/microsoft/mcp)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)

---

*This blog post provides production-ready deployment patterns for MCP servers. For development and testing, refer to the earlier posts in this series. All code examples are adapted from official MCP documentation and production deployments.*
