# AI Chatbot with Code Execution & Web Search

A JavaScript-based chatbot interface implementing secure code execution, web search capabilities, and advanced markdown rendering with comprehensive error handling and multi-provider LLM integration.

## Core Architecture

### Client-Side Implementation
The chatbot is implemented as a single-page application using vanilla JavaScript with ES6 modules. The architecture follows a class-based design pattern with the main `Chatbot` class handling all core functionality including message rendering, API communication, and tool execution.

### Message Rendering System
- **Markdown Parser**: Utilizes marked.js for GitHub Flavored Markdown parsing
- **Syntax Highlighting**: Implements highlight.js with GitHub Dark theme for code blocks
- **Mathematical Rendering**: KaTeX integration for LaTeX equation rendering (inline and display modes)
- **Dynamic Content Loading**: Asynchronous rendering with proper error handling and fallbacks
- **Copy Functionality**: JavaScript-based clipboard API integration for code blocks

### Sandboxed Code Execution
- **Isolation Layer**: Function constructor-based sandbox with restricted global scope
- **Security Model**: Explicit blocking of DOM, network, storage, and eval-based APIs
- **Execution Context**: Controlled variable scope with timeout protection (5000ms)
- **Output Capture**: Custom console implementation with structured logging
- **Memory Management**: JSON serialization for safe data transfer between contexts

### Web Search Integration
- **API Layer**: Google Custom Search Engine API implementation
- **Request Handling**: Fetch-based HTTP client with error recovery
- **Data Processing**: Structured result parsing and sanitization
- **Rate Limiting**: Built-in timeout and result count restrictions

### LLM Provider Abstraction
Multi-provider support through standardized OpenAI-compatible API interface:
- AI Pipe (OpenAI Proxy)
- OpenAI Direct API
- OpenRouter
- Anthropic Claude
- Custom endpoint configuration

Extensible function calling system supporting multiple tool types:

```javascript
// Tool definition structure
{
    type: "function",
    function: {
        name: "execute_javascript",
        description: "Execute JavaScript code in sandboxed environment",
        parameters: {
            type: "object",
            properties: {
                code: { type: "string", description: "JavaScript code to execute" },
                description: { type: "string", description: "Optional description" }
            },
            required: ["code"]
        }
    }
}
```

**Available Tools:**
- `web_search`: Google Custom Search API integration
- `execute_javascript`: Sandboxed JavaScript execution

### Error Handling System
- **Bootstrap Alert Integration**: Replaces native browser alerts with styled notifications
- **Contextual Error Messages**: Detailed error information with operation context
- **Status Management**: Real-time status updates during multi-step operations
- **Graceful Degradation**: Fallback mechanisms for API failures and configuration issues

## Installation and Setup

### Prerequisites
- Modern web browser with ES6+ support
- HTTP server (for local development)
- API keys for LLM providers (optional)
- Google Custom Search API key (optional, for web search)

### Configuration Management
The application uses localStorage for persistent configuration storage:

```javascript
// Configuration structure
{
    baseUrl: "https://api.provider.com/v1",
    apiKey: "your-api-key",
    googleApiKey: "google-search-key",
    searchEngineId: "custom-search-engine-id",
    models: ["model-1", "model-2"],
    selectedModels: ["model-1"]
}
```

## Implementation Details

### JavaScript Sandbox Security Model

The code execution environment implements multiple security layers:

```javascript
// Sandbox creation with restricted globals
const sandbox = {
    // Allowed built-ins
    Math, Date, JSON, Array, Object, String, Number, Boolean, RegExp,
    parseInt, parseFloat, isNaN, isFinite,
    
    // Blocked dangerous globals
    window: undefined, document: undefined, eval: undefined,
    Function: undefined, fetch: undefined, localStorage: undefined,
    // ... additional blocked APIs
    
    // Custom console implementation
    console: {
        log: (...args) => sandbox._output.push(formatArgs(args)),
        error: (...args) => sandbox._errors.push(formatArgs(args)),
        warn: (...args) => sandbox._warnings.push(formatArgs(args))
    }
};
```

**Security Features:**
- Function constructor isolation prevents scope escape
- Prototype chain blocking via property access control
- Timeout enforcement (5000ms execution limit)
- Memory isolation through JSON serialization
- Strict mode enforcement

### Message Processing Pipeline

1. **Input Validation**: User input sanitization and length limits
2. **API Request Construction**: OpenAI-compatible request formatting
3. **Tool Detection**: Function call parsing and validation
4. **Tool Execution**: Sandboxed execution with error handling
5. **Response Processing**: Result aggregation and formatting
6. **Markdown Rendering**: Asynchronous content processing
7. **DOM Update**: Efficient message insertion with animations

### API Communication Layer

```javascript
// Request structure for LLM providers
const requestBody = {
    model: selectedModel,
    messages: conversationHistory,
    max_tokens: 1000,
    temperature: 0.7,
    tools: getAvailableTools(),
    tool_choice: 'auto'
};
```

**Error Handling:**
- HTTP status code parsing
- JSON error message extraction
- Network timeout management
- Retry logic for transient failures

Application state is managed through a centralized class instance with the following key properties:

```javascript
class Chatbot {
    constructor() {
        this.llmConfig = null;           // LLM provider configuration
        this.currentModel = null;        // Active model selection
        this.currentStatus = 'ready';    // Application status state
        // DOM element references cached for performance
    }
}
```

**State Persistence:**
- Configuration stored in localStorage with JSON serialization
- Model selections persisted across sessions
- Error states tracked and displayed via status indicators

### File Structure and Dependencies

```
├── index.html          # Bootstrap 5 UI with custom CSS
├── chatbot.js          # ES6 class-based implementation
└── README.md          # Technical documentation
```

**External Dependencies:**
- `marked@9.1.6`: Markdown parsing engine
- `highlight.js@11.9.0`: Syntax highlighting with GitHub Dark theme
- `katex@0.16.8`: LaTeX mathematical rendering
- `bootstrap@5.3.0`: UI framework and responsive design
- `bootstrap-alert@1`: Enhanced notification system

### Extension Architecture

**Adding Custom Tools:**

```javascript
// 1. Tool definition in getAvailableTools()
tools.push({
    type: "function",
    function: {
        name: "custom_tool",
        description: "Tool description for LLM",
        parameters: { /* JSON schema */ }
    }
});

// 2. Handler implementation in handleToolCalls()
case 'custom_tool':
    result = await this.executeCustomTool(functionArgs);
    break;

// 3. Execution function with error handling
async executeCustomTool(args) {
    try {
        // Implementation logic
        return { success: true, result: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

**Provider Integration:**
New LLM providers can be added by implementing OpenAI-compatible endpoints. The system supports:
- Custom authentication headers
- Model enumeration APIs
- Streaming response handling (future enhancement)

**Optimization Strategies:**
- Lazy loading of syntax highlighting and mathematical rendering engines
- DOM element caching to reduce query overhead
- Asynchronous message processing to prevent UI blocking
- Memory-efficient sandbox cleanup after code execution
- Debounced input handling for responsive interaction

**Resource Management:**
- Timeout enforcement prevents resource exhaustion
- JSON serialization limits memory usage in sandboxed execution
- Efficient CSS animations using transform properties
- Minimal DOM manipulation through batch updates

## Security Model

### Threat Mitigation
- **XSS Prevention**: Input sanitization and output encoding
- **Code Injection**: Sandboxed execution environment with restricted globals
- **Prototype Pollution**: Blocked access to constructor chains and prototype properties
- **Resource Exhaustion**: Execution timeouts and memory limits
- **Data Exfiltration**: No network access from sandboxed code

### Authentication Security
- API keys stored in localStorage (client-side only)
- No server-side storage or transmission of credentials
- HTTPS enforcement for all external API communications

## Development and Debugging

### Browser Console Logging
The application provides comprehensive logging for development:

```javascript
// API request/response logging
console.log('Making API request to:', baseUrl);
console.log('API Response:', responseData);

// Tool execution tracking
console.log(`Executing function: ${functionName}`, functionArgs);

// Error context
console.error('LLM API error:', error);
```

### Common Development Issues

**Configuration Persistence:**
- Verify localStorage availability and quotas
- Check JSON serialization/deserialization errors
- Validate configuration schema compliance

**Sandbox Execution Failures:**
- Review JavaScript syntax and runtime errors
- Monitor execution timeout limits (5000ms)
- Check for blocked API access attempts

**API Integration Problems:**
- Validate OpenAI-compatible endpoint compliance
- Verify authentication header formatting
- Monitor rate limiting and quota restrictions

**Rendering Pipeline Issues:**
- Confirm marked.js, highlight.js, and KaTeX library loading
- Check asynchronous rendering completion
- Validate DOM manipulation timing

### Extension Development
The modular architecture supports easy extension:

1. **Tool Development**: Implement new function calling capabilities
2. **Provider Integration**: Add support for additional LLM APIs  
3. **UI Customization**: Modify Bootstrap themes and CSS variables
4. **Security Enhancement**: Extend sandbox restrictions and validation

This implementation provides a robust foundation for AI-powered chat interfaces with secure code execution capabilities.
