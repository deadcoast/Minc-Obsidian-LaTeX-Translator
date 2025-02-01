export const HelpContent = {
  overview: `# LaTeX Translator Plugin

A powerful Obsidian plugin for seamless LaTeX to Markdown conversion and vice versa.

## Key Features

- Bidirectional translation between LaTeX and Markdown
- Real-time preview and editing
- Batch operations for multiple files
- Customizable settings and shortcuts
- Error handling and recovery
- Command history and undo support

## Quick Links

- [Getting Started](#getting-started)
- [Features](#features)
- [Settings](#settings)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)`,

  'getting-started': `# Getting Started

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "LaTeX Translator"
4. Click Install and Enable

## Basic Usage

1. Open a markdown or LaTeX file
2. Use the command palette (Cmd/Ctrl + P)
3. Type "LaTeX Translator" to see available commands
4. Select your desired operation

## First Steps

1. **Configure Settings**: Review and adjust the default settings
2. **Learn Shortcuts**: Familiarize yourself with keyboard shortcuts
3. **Try Examples**: Experiment with provided example conversions
4. **Save Defaults**: Set your preferred default behaviors

## Tips for Beginners

- Start with simple documents
- Use the real-time preview
- Enable error highlighting
- Review the examples section
- Keep the documentation handy`,

  features: `# Features

## Translation

### LaTeX to Markdown
- Mathematical expressions
- Tables and figures
- Citations and references
- Custom environments
- Special characters

### Markdown to LaTeX
- Headers and sections
- Lists and enumerations
- Links and images
- Code blocks
- Footnotes

## Batch Operations

- Process multiple files
- Recursive folder processing
- Progress tracking
- Error reporting
- Backup creation

## Editor Features

- Syntax highlighting
- Real-time preview
- Error detection
- Auto-completion
- Command history

## Advanced Features

- Custom templates
- Style preservation
- Reference management
- Document statistics
- Export options`,

  settings: `# Settings Configuration

## General Settings

### Translation Options
- Default translation direction
- Preserve original formatting
- Include metadata
- Handle special characters
- Process citations

### Editor Settings
- Real-time preview
- Syntax highlighting
- Auto-completion
- Error highlighting
- Line numbers

### Batch Operations
- Default folder behavior
- Recursive processing
- Error threshold
- Backup creation
- Progress display

### Performance
- Cache size
- Processing timeout
- Memory usage
- Log rotation
- Auto-save interval

## Keyboard Shortcuts

Customize shortcuts for:
- Quick translation
- Preview toggle
- Batch operations
- Settings access
- Help display`,

  commands: `# Available Commands

## Basic Commands

- \`Convert to LaTeX\`: Convert current document to LaTeX
- \`Convert to Markdown\`: Convert current document to Markdown
- \`Toggle Preview\`: Show/hide real-time preview
- \`Show Help\`: Open this documentation
- \`Open Settings\`: Access plugin settings

## Advanced Commands

- \`Batch Convert\`: Process multiple files
- \`Export Document\`: Save in different formats
- \`Generate Report\`: Create conversion report
- \`Clear History\`: Reset command history
- \`Check Syntax\`: Validate document syntax`,

  examples: `# Usage Examples

## Basic Conversion

### Mathematical Expressions

\`\`\`latex
\\begin{equation}
E = mc^2
\\end{equation}
\`\`\`

Converts to:

\`\`\`markdown
$E = mc^2$
\`\`\`

### Tables

\`\`\`latex
\\begin{tabular}{|c|c|}
\\hline
A & B \\\\
\\hline
1 & 2 \\\\
\\hline
\\end{tabular}
\`\`\`

Converts to:

\`\`\`markdown
| A | B |
|---|---|
| 1 | 2 |
\`\`\`

## Advanced Examples

### Custom Environments

\`\`\`latex
\\begin{theorem}
This is a theorem
\\end{theorem}
\`\`\`

### Citations

\`\`\`latex
\\cite{author2023}
\`\`\`

### Complex Documents

See the [examples folder](examples/) for complete document examples.`,

  troubleshooting: `# Troubleshooting Guide

## Common Issues

### Conversion Errors

#### Syntax Errors
- **Problem**: Invalid LaTeX syntax
- **Solution**: Check command spelling and structure
- **Prevention**: Use syntax highlighting and validation

#### Missing Elements
- **Problem**: Required packages or commands not found
- **Solution**: Add necessary imports
- **Prevention**: Use templates with required packages

### Performance Issues

#### Slow Processing
- **Problem**: Large files process slowly
- **Solution**: Adjust batch size and cache settings
- **Prevention**: Split large documents

#### Memory Usage
- **Problem**: High memory consumption
- **Solution**: Clear cache and reduce batch size
- **Prevention**: Monitor resource usage

## Error Messages

### Understanding Error Output
- Error codes and meanings
- Context information
- Recovery suggestions
- Log file locations

### Recovery Steps

1. Check error logs
2. Review recent changes
3. Apply suggested fixes
4. Validate results
5. Update settings if needed`,

  'batch-operations': `# Batch Operations Guide

## Overview

Batch operations allow processing multiple files simultaneously.

## Features

- Folder processing
- Recursive operations
- Progress tracking
- Error handling
- Backup creation

## Usage

1. Select source folder
2. Configure options
3. Start processing
4. Review results
5. Handle errors

## Best Practices

- Create backups
- Set error thresholds
- Monitor progress
- Review logs
- Test with samples`,

  'keyboard-shortcuts': `# Keyboard Shortcuts

## Default Shortcuts

- \`Cmd/Ctrl + L\`: Quick convert
- \`Cmd/Ctrl + Shift + L\`: Toggle preview
- \`Cmd/Ctrl + Alt + L\`: Batch operations
- \`Cmd/Ctrl + H\`: Show help
- \`Cmd/Ctrl + ,\`: Open settings

## Customization

1. Open Settings
2. Go to Hotkeys
3. Search for "LaTeX"
4. Modify shortcuts

## Tips

- Use consistent patterns
- Avoid conflicts
- Remember common actions
- Create mnemonics
- Practice regularly`,
};

export interface HelpSection {
  id: string;
  title: string;
  icon: string;
}
