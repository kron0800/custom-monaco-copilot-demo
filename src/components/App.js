/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import ChatBox from './Chat/ChatBox';
import EditorInitializer from './Editor/EditorInitializer';
import XmlValidator from './Editor/XmlValidator';
import MonacoTheme from './Editor/MonacoTheme';
import CodeSuggester from './Editor/CodeSuggester';
import SyntaxHighlighter from './Editor/SyntaxHighligher';
import config from '../config.json';

const resolveEndpoint = (url) => {
  if (!url) return '';
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/chat/completions')) {
    return trimmed;
  }
  if (trimmed.endsWith('/v1')) {
    return `${trimmed}/chat/completions`;
  }
  return `${trimmed}/v1/chat/completions`;
};

const App = () => {
  const apiUrl = config.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
  const apiKey = config.apiKey || '';

  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const editorRef = useRef(null);

  const handleClearChat = () => {
    setMessages([]);
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const defaultContent = `<policies>
      <inbound></inbound>
      <backend></backend>
      <outbound></outbound>
      <on-error></on-error>
    </policies>`;
    const savedContent = localStorage.getItem('editorContent') || defaultContent;

    const initializer = new EditorInitializer(monaco, editorRef.current, MonacoTheme, savedContent);
    const editorInstance = initializer.initialize();

    const handleEditorChange = () => {
      const validator = new XmlValidator(editorInstance, monaco);
      const errors = validator.validate();
      setHasErrors(errors.length > 0);
      localStorage.setItem('editorContent', editorInstance.getValue());
    };

    editorInstance.onDidChangeModelContent(handleEditorChange);

    let codeSuggester = null;
    if (config.enableCodeSuggestions) {
      codeSuggester = new CodeSuggester(editorInstance, apiKey, apiUrl, () => {});
      codeSuggester.register();
    }

    const syntaxHighlighter = new SyntaxHighlighter(monaco, editorInstance);
    syntaxHighlighter.initialize();

    return () => {
      editorInstance.dispose();
      if (codeSuggester) {
        codeSuggester.dispose();
      }
    };
  }, []);

  const handleMessageSent = async (message) => {
    setMessages((prevMessages) => [...prevMessages, { type: 'user', text: message }]);
    setIsStreaming(true);
    setHasErrors(false);
    const currentModel = monaco.editor.getModels()[0];
    const currentCode = currentModel ? currentModel.getValue() : '';

    const targetUrl = resolveEndpoint(apiUrl);
    const headers = {
      'Content-Type': 'application/json',
    };

    if (targetUrl.includes('.openai.azure.com')) {
      if (apiKey) {
        headers['api-key'] = apiKey;
      }
    } else if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: config.model || 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are an AI assistant that helps with coding and Azure API Management policy development. Provide helpful suggestions and answers based on the code context and user messages.',
            },
            {
              role: 'user',
              content: `Here's the current code:\n\n${currentCode}\n\nUser message: ${message}`,
            },
          ],
          max_tokens: config.max_tokens || 500,
          n: 1,
          stream: true,
          temperature: config.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}`, errorText);
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: 'bot', text: `Server error (${response.status}): ${errorText || response.statusText}` },
        ]);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === '') continue;
          if (trimmedLine === 'data: [DONE]') continue;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              if (data.choices && data.choices.length > 0) {
                const delta = data.choices[0].delta;
                const tokenContent = delta?.content || delta?.text || '';
                if (tokenContent) {
                  setMessages((prevMessages) => {
                    const lastMessage = prevMessages[prevMessages.length - 1];
                    if (lastMessage && lastMessage.type === 'bot') {
                      return [
                        ...prevMessages.slice(0, -1),
                        { type: 'bot', text: lastMessage.text + tokenContent },
                      ];
                    } else {
                      return [...prevMessages, { type: 'bot', text: tokenContent }];
                    }
                  });
                }
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
              continue;
            }
          }
        }
      }

      if (buffer.trim() && !buffer.trim().startsWith('data:')) {
        try {
          const data = JSON.parse(buffer.trim());
          const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text;
          if (content) {
            setMessages((prevMessages) => {
              const lastMessage = prevMessages[prevMessages.length - 1];
              if (lastMessage && lastMessage.type === 'bot') {
                return [
                  ...prevMessages.slice(0, -1),
                  { type: 'bot', text: lastMessage.text + content },
                ];
              } else {
                return [...prevMessages, { type: 'bot', text: content }];
              }
            });
          }
        } catch {
          // ignore
        }
      }
    } catch (error) {
      console.error('Error in chat request:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: 'bot',
          text: `API connection error (${targetUrl}): ${error.message}. Ensure the endpoint is running and allows CORS requests.`,
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="app">
      <div className="editor-chat-container">
        <div className="editor">
          <div ref={editorRef} className="monaco-editor" style={{ height: '100%', width: '100%' }} />
        </div>
        <div className="chat">
          <ChatBox
            onMessageSent={handleMessageSent}
            messages={messages}
            isStreaming={isStreaming}
            hasErrors={hasErrors}
            onClearChat={handleClearChat}
          />
        </div>
      </div>
    </div>
  );
};

export default App;