// LLM configuration with manual API key support

class Chatbot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.modelSelector = document.getElementById('modelSelector');
        this.configButton = document.getElementById('configButton');
        
        // Modal elements
        this.modal = document.getElementById('llmConfigModal');
        this.modalClose = document.getElementById('modalClose');
        this.modalCancel = document.getElementById('modalCancel');
        this.modalSave = document.getElementById('modalSave');
        this.providerSelect = document.getElementById('providerSelect');
        this.otherProviderGroup = document.getElementById('otherProviderGroup');
        this.otherProviderSelect = document.getElementById('otherProviderSelect');
        this.customUrlGroup = document.getElementById('customUrlGroup');
        this.customBaseUrl = document.getElementById('customBaseUrl');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.googleApiKeyInput = document.getElementById('googleApiKeyInput');
        this.searchEngineIdInput = document.getElementById('searchEngineIdInput');
        this.modelSelect = document.getElementById('modelSelect');
        this.customModelInput = document.getElementById('customModelInput');
        this.addModelButton = document.getElementById('addModelButton');
        
        // Status elements
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        
        this.llmConfig = null;
        this.currentModel = null;
        this.currentStatus = 'ready';
        
        this.setupEventListeners();
        this.loadSavedConfig();
        this.setupMarkdownRenderer();
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Modal event listeners
        this.configButton.addEventListener('click', () => this.showModal());
        this.modalClose.addEventListener('click', () => this.hideModal());
        this.modalCancel.addEventListener('click', () => this.hideModal());
        this.modalSave.addEventListener('click', () => this.saveConfig());
        
        // Provider selection
        this.providerSelect.addEventListener('change', (e) => {
            this.otherProviderGroup.style.display = e.target.value === 'other' ? 'block' : 'none';
            if (e.target.value !== 'other') {
                this.customUrlGroup.style.display = 'none';
            }
        });
        
        this.otherProviderSelect.addEventListener('change', (e) => {
            this.customUrlGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
        
        this.addModelButton.addEventListener('click', () => this.addCustomModel());
        
        this.modelSelector.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
        });
        
        // Close modal on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
        
        // Remove auto-focus behavior
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Add user message
        this.addUserMessage(message);
        this.chatInput.value = '';
        
        // Input focus removed

        // Show typing indicator and keep it visible throughout the entire process
        this.showTypingIndicator();

        try {
            // Generate bot response (this will handle all status updates internally)
            await this.generateBotResponse(message);
        } finally {
            // Always hide typing indicator when done
            this.hideTypingIndicator();
        }
    }

    addUserMessage(message) {
        const messageElement = this.createMessageElement(message, 'user');
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    addBotMessage(message) {
        const messageElement = this.createMessageElement(message, 'bot');
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    createMessageElement(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `d-flex py-2 message-${type} ${type === 'user' ? 'justify-content-end' : 'justify-content-start'}`;

        const avatar = document.createElement('div');
        avatar.className = `d-flex align-items-center justify-content-center fw-semibold fs-6 message-avatar ${type === 'user' ? 'order-2 ms-3' : 'me-3'}`;
        avatar.style.width = '32px';
        avatar.style.height = '32px';
        avatar.textContent = type === 'user' ? 'U' : 'AI';

        const content = document.createElement('div');
        content.className = `message-content`;
        content.style.maxWidth = '80%';
        content.style.wordWrap = 'break-word';
        content.style.lineHeight = '1.7';
        content.style.fontSize = '15px';
        
        // Render markdown for bot messages, plain text for user messages
        if (type === 'bot') {
            content.innerHTML = this.renderMarkdown(message);
            // Apply syntax highlighting to code blocks
            setTimeout(() => {
                content.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
                // Render math with KaTeX
                renderMathInElement(content, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError: false
                });
                
                // Adjust avatar alignment based on content height
                this.adjustAvatarAlignment(messageDiv, content, avatar);
            }, 0);
        } else {
            content.textContent = message;
            // Adjust avatar alignment for user messages immediately
            setTimeout(() => {
                this.adjustAvatarAlignment(messageDiv, content, avatar);
            }, 0);
        }

        if (type === 'user') {
            messageDiv.appendChild(content);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);
        }

        return messageDiv;
    }

    adjustAvatarAlignment(messageDiv, content, avatar) {
        // Check if content is single line or multi-line
        const contentHeight = content.offsetHeight;
        const lineHeight = parseFloat(getComputedStyle(content).lineHeight);
        const isSingleLine = contentHeight <= lineHeight * 1.5; // Allow some tolerance
        
        if (isSingleLine) {
            // Center align for single line messages
            messageDiv.classList.add('align-items-center');
            messageDiv.classList.remove('align-items-start', 'align-items-end');
        } else {
            // Bottom align for multi-line messages
            messageDiv.classList.add('align-items-end');
            messageDiv.classList.remove('align-items-center', 'align-items-start');
        }
    }

    showTypingIndicator() {
        // Create typing indicator inline with messages
        const typingDiv = document.createElement('div');
        typingDiv.className = 'd-flex align-items-start py-2 message-bot justify-content-start';
        typingDiv.id = 'currentTypingIndicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'd-flex align-items-center justify-content-center fw-semibold fs-6 message-avatar me-3';
        avatar.style.width = '32px';
        avatar.style.height = '32px';
        avatar.style.background = '#10b981';
        avatar.style.color = '#ffffff';
        avatar.textContent = 'AI';
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'd-flex gap-1 align-items-center';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            dotsContainer.appendChild(dot);
        }
        
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(dotsContainer);
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
        
        // Add entrance animation
        typingDiv.style.opacity = '0';
        typingDiv.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            typingDiv.style.transition = 'all 0.3s ease';
            typingDiv.style.opacity = '1';
            typingDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    hideTypingIndicator() {
        const currentTyping = document.getElementById('currentTypingIndicator');
        if (currentTyping) {
            // Add exit animation
            currentTyping.style.transition = 'all 0.2s ease';
            currentTyping.style.opacity = '0';
            currentTyping.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                currentTyping.remove();
            }, 200);
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    loadSavedConfig() {
        const saved = localStorage.getItem('llmConfig');
        if (saved) {
            try {
                this.llmConfig = JSON.parse(saved);
                // Ensure selectedModels exists for backward compatibility
                if (!this.llmConfig.selectedModels) {
                    this.llmConfig.selectedModels = this.llmConfig.models || [];
                }
                // Set default current model to gpt-4.1-nano if available
                if (!this.currentModel && this.llmConfig.selectedModels.includes('gpt-4.1-nano')) {
                    this.currentModel = 'gpt-4.1-nano';
                }
                this.updateModelSelector();
                // Check if API key is missing and show appropriate status
                if (!this.llmConfig.apiKey) {
                    this.updateStatus('error', 'Config Error');
                } else {
                    this.updateStatus('ready', 'Ready');
                }
            } catch (error) {
                console.log('Error loading saved config:', error);
                window.bootstrapAlert({ 
                    title: 'Configuration Error', 
                    body: 'Failed to load saved configuration. Using defaults.', 
                    color: 'warning' 
                });
            }
        } else {
            // Set default configuration
            this.setDefaultConfig();
        }
    }

    setDefaultConfig() {
        this.llmConfig = {
            baseUrl: 'https://aipipe.org/openai/v1',
            apiKey: '',
            googleApiKey: '',
            searchEngineId: '',
            models: [
                'gpt-4.1-nano',
                'gpt-4-turbo',
                'gpt-4o',
                'gpt-4o-mini',
                'chatgpt-4o-latest',
                'o1-mini',
                'o3-mini',
                'gpt-4.1-mini',
                'gpt-4.1'
            ],
            selectedModels: [
                'gpt-4.1-nano',
                'gpt-4-turbo',
                'gpt-4o',
                'gpt-4o-mini',
                'chatgpt-4o-latest',
                'o1-mini',
                'o3-mini',
                'gpt-4.1-mini',
                'gpt-4.1'
            ]
        };
        this.currentModel = 'gpt-4.1-nano';
        this.updateModelSelector();
        this.updateStatus('error', 'Config Error');
    }

    showModal() {
        // Populate form with existing config if available
        if (this.llmConfig) {
            if (this.llmConfig.baseUrl === 'https://aipipe.org/openai/v1') {
                this.providerSelect.value = 'https://aipipe.org/openai/v1';
            } else {
                this.providerSelect.value = 'other';
                this.otherProviderGroup.style.display = 'block';
                
                if (['https://aipipe.org/openrouter/v1', 'https://api.openai.com/v1', 'https://openrouter.ai/api/v1', 'https://api.anthropic.com/v1'].includes(this.llmConfig.baseUrl)) {
                    this.otherProviderSelect.value = this.llmConfig.baseUrl;
                } else {
                    this.otherProviderSelect.value = 'custom';
                    this.customBaseUrl.value = this.llmConfig.baseUrl;
                    this.customUrlGroup.style.display = 'block';
                }
            }
            
            this.apiKeyInput.value = this.llmConfig.apiKey || '';
            this.googleApiKeyInput.value = this.llmConfig.googleApiKey || '';
            this.searchEngineIdInput.value = this.llmConfig.searchEngineId || '';
            this.populateModelSelect();
        }
        
        this.modal.classList.add('show');
        this.apiKeyInput.focus();
    }

    hideModal() {
        this.modal.classList.remove('show');
    }

    async saveConfig() {
        let baseUrl;
        
        if (this.providerSelect.value === 'other') {
            if (this.otherProviderSelect.value === 'custom') {
                baseUrl = this.customBaseUrl.value.trim();
                if (!baseUrl) {
                    window.bootstrapAlert({ title: 'Configuration Error', body: 'Please enter a custom base URL.', color: 'danger' });
                    return;
                }
            } else {
                baseUrl = this.otherProviderSelect.value;
            }
        } else {
            baseUrl = this.providerSelect.value;
        }
        
        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
            window.bootstrapAlert({ title: 'Configuration Error', body: 'Please enter an API key.', color: 'danger' });
            return;
        }
        
        // Get selected models from the modal
        const selectedModels = Array.from(this.modelSelect.selectedOptions).map(option => option.value);
        if (selectedModels.length === 0) {
            window.bootstrapAlert({ title: 'Configuration Error', body: 'Please select at least one model.', color: 'danger' });
            return;
        }
        
        // Update the selectedModels (keep all models available, just track which are selected)
        this.llmConfig.selectedModels = selectedModels;
        
        // If current model is not in selected models, set to gpt-4.1-nano or first selected
        if (!selectedModels.includes(this.currentModel)) {
            this.currentModel = selectedModels.includes('gpt-4.1-nano') ? 'gpt-4.1-nano' : selectedModels[0];
        }
        
        this.llmConfig.baseUrl = baseUrl;
        this.llmConfig.apiKey = apiKey;
        this.llmConfig.googleApiKey = this.googleApiKeyInput.value.trim();
        this.llmConfig.searchEngineId = this.searchEngineIdInput.value.trim();
        
        // Fetch models from API if needed
        if (baseUrl !== 'https://aipipe.org/openai/v1') {
            try {
                const models = await this.fetchModelsFromAPI(baseUrl, apiKey);
                if (models && models.length > 0) {
                    this.llmConfig.models = models;
                    // If we got new models, reset selectedModels to all models
                    this.llmConfig.selectedModels = models;
                }
            } catch (error) {
                console.log('Could not fetch models, using selected models');
                window.bootstrapAlert({ 
                    title: 'Model Fetch Warning', 
                    body: 'Could not fetch models from API. Using selected models.', 
                    color: 'warning' 
                });
            }
        }
        
        // Save to localStorage
        localStorage.setItem('llmConfig', JSON.stringify(this.llmConfig));
        
        // Update both the main selector and the modal
        this.updateModelSelector();
        this.populateModelSelect(); // Keep modal populated
        this.updateStatus('ready', 'Ready');
        this.hideModal();
    }
    
    updateModelSelector() {
        this.modelSelector.innerHTML = '<option value="">Select Model</option>';
        if (this.llmConfig && this.llmConfig.selectedModels && this.llmConfig.selectedModels.length > 0) {
            this.llmConfig.selectedModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                this.modelSelector.appendChild(option);
            });
            
            // Set gpt-4.1-nano as default if no current model or current model not in list
            if (!this.currentModel || !this.llmConfig.selectedModels.includes(this.currentModel)) {
                this.currentModel = this.llmConfig.selectedModels.includes('gpt-4.1-nano') ? 'gpt-4.1-nano' : this.llmConfig.selectedModels[0];
            }
            this.modelSelector.value = this.currentModel;
        }
    }
    
    getSelectedModelsFromModal() {
        if (!this.modelSelect) return null;
        const selectedOptions = Array.from(this.modelSelect.selectedOptions);
        return selectedOptions.map(option => option.value);
    }

    populateModelSelect() {
        this.modelSelect.innerHTML = '';
        if (this.llmConfig && this.llmConfig.models) {
            // Always show all available models in the modal
            this.llmConfig.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                // Select only the models that are in selectedModels
                option.selected = this.llmConfig.selectedModels && this.llmConfig.selectedModels.includes(model);
                this.modelSelect.appendChild(option);
            });
        }
    }
    
    addCustomModel() {
        const customModel = this.customModelInput.value.trim();
        if (!customModel) return;
        
        // Check if model already exists
        const existingOptions = Array.from(this.modelSelect.options);
        if (existingOptions.some(option => option.value === customModel)) {
            window.bootstrapAlert({ title: 'Model Error', body: 'Model already exists in the list.', color: 'warning' });
            return;
        }
        
        // Add new model option
        const option = document.createElement('option');
        option.value = customModel;
        option.textContent = customModel;
        option.selected = true;
        this.modelSelect.appendChild(option);
        
        // Clear input
        this.customModelInput.value = '';
    }

    updateStatus(status, text) {
        this.currentStatus = status;
        this.statusText.textContent = text;
        
        // Remove all status classes
        this.statusDot.classList.remove('ready', 'generating', 'error', 'waiting');
        
        // Add current status class
        this.statusDot.classList.add(status);
    }

    async fetchModelsFromAPI(baseUrl, apiKey) {
        try {
            const response = await fetch(`${baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.data ? data.data.map(model => model.id) : [];
            }
        } catch (error) {
            console.log('Error fetching models:', error);
            window.bootstrapAlert({ 
                title: 'Model Fetch Error', 
                body: `Failed to fetch available models: ${error.message}`, 
                color: 'warning' 
            });
        }
        return null;
    }

    setDefaultModels(baseUrl) {
        if (baseUrl === 'https://aipipe.org/openai/v1') {
            this.llmConfig.models = [
                'gpt-4.1-nano',
                'gpt-4-turbo',
                'gpt-4o',
                'gpt-4o-mini',
                'chatgpt-4o-latest',
                'o1-mini',
                'o3-mini',
                'gpt-4.1-mini',
                'gpt-4.1'
            ];
        } else if (baseUrl === 'https://api.openai.com/v1') {
            this.llmConfig.models = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
        } else {
            this.llmConfig.models = ['gpt-4', 'gpt-3.5-turbo'];
        }
    }

    async generateBotResponse(userMessage) {
        if (this.llmConfig && this.currentModel) {
            try {
                this.updateStatus('generating', 'Connecting to AI...');
                const response = await this.callLLMAPI(userMessage);
                this.updateStatus('generating', 'Finalizing response...');
                this.addBotMessage(response);
                this.updateStatus('ready', 'Ready');
                return;
            } catch (error) {
                console.error('LLM API error:', error);
                window.bootstrapAlert({ 
                    title: 'API Error', 
                    body: `Failed to generate response: ${error.message}`, 
                    color: 'danger',
                    autohide: false
                });
                this.addBotMessage('Sorry, I encountered an error. Please check your LLM configuration.');
                this.updateStatus('error', 'Error occurred');
                setTimeout(() => this.updateStatus('ready', 'Ready'), 3000);
                return;
            }
        }
        
        // Fallback to mock responses if no LLM configured
        this.updateStatus('error', 'Config Error');
        this.generateMockResponse(userMessage);
        setTimeout(() => this.updateStatus('error', 'Config Error'), 2000);
    }

    async callLLMAPI(userMessage) {
        // For AI Pipe, ensure proper token format
        let headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header (only use Bearer, not X-API-Key to avoid CORS)
        if (this.llmConfig.apiKey) {
            headers['Authorization'] = `Bearer ${this.llmConfig.apiKey}`;
        }
        
        // Use model name as-is for all providers
        const apiModel = this.currentModel;
        
        const requestBody = {
            model: apiModel,
            messages: [{
                role: 'user',
                content: userMessage
            }],
            max_tokens: 1000,
            temperature: 0.7,
            tools: this.getAvailableTools(),
            tool_choice: 'auto'
        };
        
        console.log('Making API request to:', this.llmConfig.baseUrl);
        console.log('With model:', this.currentModel);
        console.log('Headers:', headers);
        
        this.updateStatus('generating', `Sending request to ${this.currentModel}...`);
        
        const response = await fetch(`${this.llmConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorData.message || errorText;
            } catch (e) {
                errorMessage = errorText || `HTTP ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        this.updateStatus('generating', 'Processing AI response...');
        const data = await response.json();
        console.log('API Response:', data);
        
        const message = data.choices[0].message;
        
        // Handle function calls
        if (message.tool_calls && message.tool_calls.length > 0) {
            this.updateStatus('generating', `Executing ${message.tool_calls.length} tool call(s)...`);
            return await this.handleToolCalls(message, userMessage);
        }
        
        return message.content;
    }

    getAvailableTools() {
        const tools = [];
        
        // Add web search tool if Google API key is configured
        if (this.llmConfig && this.llmConfig.googleApiKey) {
            tools.push({
                type: "function",
                function: {
                    name: "web_search",
                    description: "Search the web for current information, news, or any topic that requires up-to-date data",
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "The search query to look up on the web"
                            },
                            num_results: {
                                type: "integer",
                                description: "Number of search results to return (default: 5, max: 10)",
                                default: 5
                            }
                        },
                        required: ["query"]
                    }
                }
            });
        }
        
        // Add JavaScript code execution tool (always available)
        tools.push({
            type: "function",
            function: {
                name: "execute_javascript",
                description: "Execute JavaScript code in a sandboxed environment and return the result. Useful for calculations, data processing, demonstrations, and code examples.",
                parameters: {
                    type: "object",
                    properties: {
                        code: {
                            type: "string",
                            description: "The JavaScript code to execute. Can include console.log statements for output."
                        },
                        description: {
                            type: "string",
                            description: "Optional description of what the code does"
                        }
                    },
                    required: ["code"]
                }
            }
        });
        
        return tools;
    }
    
    async handleToolCalls(message, originalUserMessage) {
        const toolCalls = message.tool_calls;
        const toolResults = [];
        
        // Execute each tool call
        for (let i = 0; i < toolCalls.length; i++) {
            const toolCall = toolCalls[i];
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            
            this.updateStatus('generating', `Executing ${functionName} (${i + 1}/${toolCalls.length})...`);
            console.log(`Executing function: ${functionName}`, functionArgs);
            
            let result;
            try {
                switch (functionName) {
                    case 'web_search':
                        this.updateStatus('generating', `Searching web: "${functionArgs.query}"...`);
                        result = await this.executeWebSearch(functionArgs.query, functionArgs.num_results || 5);
                        break;
                    case 'execute_javascript':
                        this.updateStatus('generating', 'Executing JavaScript code...');
                        result = await this.executeJavaScript(functionArgs.code, functionArgs.description);
                        break;
                    default:
                        result = { error: `Unknown function: ${functionName}` };
                }
            } catch (error) {
                console.error(`Tool execution error for ${functionName}:`, error);
                window.bootstrapAlert({ 
                    title: 'Tool Error', 
                    body: `Failed to execute ${functionName}: ${error.message}`, 
                    color: 'danger' 
                });
                result = { error: error.message };
            }
            
            toolResults.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: JSON.stringify(result)
            });
        }
        
        // Make a follow-up API call with the tool results
        this.updateStatus('generating', 'Processing tool results...');
        return await this.callLLMAPIWithToolResults(originalUserMessage, message, toolResults);
    }
    
    async executeWebSearch(query, numResults = 5) {
        if (!this.llmConfig.googleApiKey) {
            return { error: "Google API key not configured" };
        }
        
        const searchEngineId = this.llmConfig.searchEngineId || '017576662512468239146:omuauf_lfve'; // Default CSE ID
        const apiKey = this.llmConfig.googleApiKey;
        
        try {
            this.updateStatus('generating', `Fetching ${numResults} search results...`);
            const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=${Math.min(numResults, 10)}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Search API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                this.updateStatus('generating', 'No search results found, continuing...');
                return { results: [], message: "No search results found" };
            }
            
            this.updateStatus('generating', `Found ${data.items.length} results, processing...`);
            const results = data.items.map(item => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet,
                displayLink: item.displayLink
            }));
            
            return {
                query: query,
                results: results,
                totalResults: data.searchInformation?.totalResults || 0
            };
        } catch (error) {
            console.error('Web search error:', error);
            window.bootstrapAlert({ 
                title: 'Search Error', 
                body: `Web search failed: ${error.message}`, 
                color: 'warning' 
            });
            return { error: `Search failed: ${error.message}` };
        }
    }
    
    async executeJavaScript(code, description = '') {
        try {
            this.updateStatus('generating', 'Running code in sandbox...');
            
            // Create a completely isolated sandbox environment
            const sandbox = {
                // Safe console methods that capture output
                console: {
                    log: (...args) => {
                        sandbox._output.push(args.map(arg => 
                            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                        ).join(' '));
                    },
                    error: (...args) => {
                        sandbox._errors.push(args.map(arg => 
                            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                        ).join(' '));
                    },
                    warn: (...args) => {
                        sandbox._warnings.push(args.map(arg => 
                            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                        ).join(' '));
                    }
                },
                // Safe built-in objects and functions
                Math: Math,
                Date: Date,
                JSON: JSON,
                Array: Array,
                Object: Object,
                String: String,
                Number: Number,
                Boolean: Boolean,
                RegExp: RegExp,
                parseInt: parseInt,
                parseFloat: parseFloat,
                isNaN: isNaN,
                isFinite: isFinite,
                encodeURIComponent: encodeURIComponent,
                decodeURIComponent: decodeURIComponent,
                
                // Block dangerous globals
                window: undefined,
                document: undefined,
                global: undefined,
                globalThis: undefined,
                self: undefined,
                top: undefined,
                parent: undefined,
                frames: undefined,
                location: undefined,
                navigator: undefined,
                history: undefined,
                localStorage: undefined,
                sessionStorage: undefined,
                indexedDB: undefined,
                fetch: undefined,
                XMLHttpRequest: undefined,
                WebSocket: undefined,
                Worker: undefined,
                SharedWorker: undefined,
                ServiceWorker: undefined,
                eval: undefined,
                Function: undefined,
                
                // Internal tracking
                _output: [],
                _errors: [],
                _warnings: [],
                _result: undefined
            };
            
            // Create secure wrapper that prevents access to outer scope
            const secureCode = `
                "use strict";
                (function() {
                    // Block access to constructor chains that could escape sandbox
                    const blockedProps = ['constructor', 'prototype', '__proto__', 'caller', 'callee'];
                    
                    // Proxy handler to block dangerous property access
                    const secureHandler = {
                        get(target, prop) {
                            if (blockedProps.includes(prop)) {
                                throw new Error('Access denied: ' + prop);
                            }
                            return target[prop];
                        },
                        set(target, prop, value) {
                            if (blockedProps.includes(prop)) {
                                throw new Error('Access denied: ' + prop);
                            }
                            target[prop] = value;
                            return true;
                        }
                    };
                    
                    try {
                        const result = (function() {
                            ${code}
                        })();
                        _result = result;
                        return result;
                    } catch (error) {
                        console.error('Execution Error:', error.message);
                        throw error;
                    }
                })();
            `;
            
            // Create function with only sandbox variables in scope
            const sandboxKeys = Object.keys(sandbox);
            const sandboxValues = Object.values(sandbox);
            
            // Use Function constructor to create isolated execution context
            const func = new Function(...sandboxKeys, `return ${secureCode}`);
            
            // Execute with timeout protection
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Code execution timeout (5 seconds)')), 5000)
            );
            
            const executionPromise = new Promise((resolve, reject) => {
                try {
                    const result = func(...sandboxValues);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            
            const result = await Promise.race([executionPromise, timeoutPromise]);
            
            // Prepare secure response with only safe data
            const response = {
                success: true,
                result: this.sanitizeOutput(result),
                output: sandbox._output.map(o => this.sanitizeOutput(o)),
                errors: sandbox._errors.map(e => this.sanitizeOutput(e)),
                warnings: sandbox._warnings.map(w => this.sanitizeOutput(w)),
                description: description || 'JavaScript code execution'
            };
            
            // Add execution summary
            if (sandbox._output.length > 0) {
                response.console_output = sandbox._output.join('\n');
            }
            
            if (sandbox._errors.length > 0) {
                response.console_errors = sandbox._errors.join('\n');
            }
            
            if (sandbox._warnings.length > 0) {
                response.console_warnings = sandbox._warnings.join('\n');
            }
            
            this.updateStatus('generating', 'Code executed successfully');
            return response;
            
        } catch (error) {
            console.error('JavaScript execution error:', error);
            window.bootstrapAlert({ 
                title: 'Code Execution Error', 
                body: `JavaScript execution failed: ${error.message}`, 
                color: 'warning' 
            });
            
            return {
                success: false,
                error: error.message,
                description: description || 'JavaScript code execution'
            };
        }
    }
    
    sanitizeOutput(value) {
        // Sanitize output to prevent any potential security issues
        if (value === null || value === undefined) {
            return value;
        }
        
        if (typeof value === 'function') {
            return '[Function]';
        }
        
        if (typeof value === 'object') {
            try {
                // Create a clean copy without prototype chain
                return JSON.parse(JSON.stringify(value));
            } catch (e) {
                return '[Object - could not serialize]';
            }
        }
        
        return value;
    }
    
    async callLLMAPIWithToolResults(originalUserMessage, assistantMessage, toolResults) {
        const messages = [
            { role: 'user', content: originalUserMessage },
            assistantMessage,
            ...toolResults
        ];
        
        const apiModel = this.currentModel;
        
        const requestBody = {
            model: apiModel,
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        };
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.llmConfig.apiKey) {
            headers['Authorization'] = `Bearer ${this.llmConfig.apiKey}`;
        }
        
        this.updateStatus('generating', 'Sending tool results to AI...');
        
        const response = await fetch(`${this.llmConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorData.message || errorText;
            } catch (e) {
                errorMessage = errorText || `HTTP ${response.status}`;
            }
            window.bootstrapAlert({ 
                title: 'API Error', 
                body: `Tool result API call failed: ${errorMessage}`, 
                color: 'danger' 
            });
            throw new Error(errorMessage);
        }
        
        this.updateStatus('generating', 'Generating final response...');
        const data = await response.json();
        return data.choices[0].message.content;
    }

    generateMockResponse(userMessage) {
        const responses = [
            "That's an interesting question! Let me think about it...",
            "I understand what you're asking. Here's what I can tell you...",
            "Great question! Based on my knowledge, I'd say...",
            "I'm processing your request. Here's my response...",
            "Thanks for asking! Let me help you with that...",
            "I appreciate your question. Here's what I found...",
            "That's a good point! Let me elaborate on that...",
            "I'm here to help! Here's what I can share about that...",
            "Interesting perspective! Here's my take on it...",
            "I'm glad you asked! Let me explain..."
        ];

        // Simple keyword-based responses
        let response = "";
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            response = "Hello there! How can I assist you today?";
        } else if (lowerMessage.includes('help')) {
            response = "I'm here to help! I can answer questions, provide information, or just chat with you. What do you need help with?";
        } else if (lowerMessage.includes('markdown') || lowerMessage.includes('code')) {
            response = `# Markdown Support\n\nI can render **markdown** with:\n\n- **Bold text**\n- *Italic text*\n- \`inline code\`\n- Code blocks:\n\n\`\`\`javascript\nfunction hello() {\n    console.log('Hello, World!');\n}\n\`\`\`\n\n## Tables\n\n| Feature | Status |\n|---------|--------|\n| Markdown | ✅ |\n| Syntax Highlighting | ✅ |\n| Math | ✅ |\n| Code Execution | ✅ |\n\n## Math\n\nInline math: $E = mc^2$\n\nBlock math:\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\n## Code Execution\n\nI can also execute JavaScript code in a sandbox environment!`;
        } else if (lowerMessage.includes('name')) {
            response = "I'm your AI assistant! I don't have a specific name, but I'm here to help you with whatever you need.";
        } else if (lowerMessage.includes('weather')) {
            response = "I can't check real-time weather, but I'd recommend checking a weather app or website for current conditions!";
        } else if (lowerMessage.includes('time')) {
            response = `The current time is ${new Date().toLocaleTimeString()}. How can I help you?`;
        } else if (lowerMessage.includes('thank')) {
            response = "You're very welcome! I'm happy to help. Is there anything else you'd like to know?";
        } else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
            response = "Goodbye! It was nice chatting with you. Feel free to come back anytime!";
        } else {
            // Random response for other messages
            response = responses[Math.floor(Math.random() * responses.length)];
        }

        this.addBotMessage(response);
    }

    setupMarkdownRenderer() {
        // Configure marked.js for better rendering
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false
            });
        }
    }

    renderMarkdown(text) {
        if (typeof marked === 'undefined') {
            return this.escapeHtml(text).replace(/\n/g, '<br>');
        }

        try {
            let html = marked.parse(text);
            
            // Add copy buttons to code blocks
            html = html.replace(/<pre><code([^>]*)>/g, (match, attributes) => {
                const lang = attributes.match(/class="language-([^"]*)"/)?.[1] || '';
                return `<div class="code-block-wrapper"><button class="copy-button" onclick="this.parentElement.querySelector('code').textContent && navigator.clipboard.writeText(this.parentElement.querySelector('code').textContent).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy', 1000); })">Copy</button><pre><code${attributes}>`;
            });
            
            html = html.replace(/<\/code><\/pre>/g, '</code></pre></div>');
            
            return html;
        } catch (error) {
            console.error('Markdown rendering error:', error);
            return this.escapeHtml(text).replace(/\n/g, '<br>');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Chatbot();
});

// Global function for copy button functionality
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
};
