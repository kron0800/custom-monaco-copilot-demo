/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { conf, language } from 'monaco-editor/esm/vs/basic-languages/xml/xml';

class SyntaxHighlighter {
  constructor(monacoInstance, editor) {
    this.monaco = monacoInstance;
    this.editor = editor;
  }

  initialize() {
    // 1. Ensure 'xml' language is registered and configured
    const registeredLangs = this.monaco.languages.getLanguages();
    if (!registeredLangs.some((lang) => lang.id === 'xml')) {
      this.monaco.languages.register({ id: 'xml' });
    }

    // Enhance standard XML language tokenizer with APIM policy section tokens
    const apimXmlLanguage = {
      ...language,
      tokenizer: {
        ...language.tokenizer,
        root: [
          [/(<)(\/?inbound)(\s*>)/, [{ token: 'delimiter' }, { token: 'tag.inbound' }, { token: 'delimiter' }]],
          [/(<)(\/?backend)(\s*>)/, [{ token: 'delimiter' }, { token: 'tag.backend' }, { token: 'delimiter' }]],
          [/(<)(\/?outbound)(\s*>)/, [{ token: 'delimiter' }, { token: 'tag.outbound' }, { token: 'delimiter' }]],
          [/(<)(\/?on-error)(\s*>)/, [{ token: 'delimiter' }, { token: 'tag.on-error' }, { token: 'delimiter' }]],
          ...language.tokenizer.root,
        ],
      },
    };

    this.monaco.languages.setLanguageConfiguration('xml', conf);
    this.monaco.languages.setMonarchTokensProvider('xml', apimXmlLanguage);

    // 2. Define theme with full token rules
    this.monaco.editor.defineTheme('apimPolicyTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'd4d4d4' },
        { token: 'delimiter', foreground: '808080' },
        { token: 'tag', foreground: '569cd6' },
        { token: 'tag.inbound', foreground: 'ff6b4a', fontStyle: 'bold' },
        { token: 'tag.backend', foreground: '4ec9b0', fontStyle: 'bold' },
        { token: 'tag.outbound', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'tag.on-error', foreground: 'e5c07b', fontStyle: 'bold' },
        { token: 'attribute.name', foreground: '9cdcfe' },
        { token: 'attribute.value', foreground: 'ce9178' },
        { token: 'attribute', foreground: '9cdcfe' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'metatag', foreground: 'c586c0' },
      ],
      colors: {
        'editor.foreground': '#d4d4d4',
        'editor.background': '#1e1e1e',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#2a2d2e',
      },
    });

    // Apply the theme
    this.monaco.editor.setTheme('apimPolicyTheme');

    // 3. Ensure the current model uses the 'xml' language
    const model = this.editor.getModel();
    if (model) {
      this.monaco.editor.setModelLanguage(model, 'xml');
    }
  }
}

export default SyntaxHighlighter;