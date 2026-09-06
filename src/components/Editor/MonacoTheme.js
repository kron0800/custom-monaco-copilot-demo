/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const MonacoTheme = {
  base: 'vs-dark',
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
    // Editor main colors
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    
    // Line numbers
    'editorLineNumber.foreground': '#858585',
    
    // Cursor and selection
    'editorCursor.foreground': '#d4d4d4',
    'editor.selectionBackground': '#264f78',
    'editor.inactiveSelectionBackground': '#3a3d41',
    
    // Editor widgets (e.g., find, replace)
    'editorWidget.background': '#252526',
    'editorWidget.border': '#454545',
    
    // Suggestion widget
    'editorSuggestWidget.background': '#252526',
    'editorSuggestWidget.border': '#454545',
    'editorSuggestWidget.foreground': '#d4d4d4',
    'editorSuggestWidget.highlightForeground': '#0097fb',
    'editorSuggestWidget.selectedBackground': '#264f78',
    
    // Hover widget
    'editorHoverWidget.background': '#252526',
    'editorHoverWidget.border': '#454545',
    
    // Gutter (left side line modification indicators)
    'editorGutter.background': '#1e1e1e',
    'editorGutter.modifiedBackground': '#0097fb',
    'editorGutter.addedBackground': '#487e02',
    'editorGutter.deletedBackground': '#f44747',
  },
};

export default MonacoTheme;