/**
 * Localization Audit Utility
 * Finds hardcoded strings and suggests translation keys
 */

import fs from 'fs';
import path from 'path';

interface HardcodedString {
  file: string;
  line: number;
  content: string;
  type: 'string' | 'template' | 'jsx';
  suggestedKey: string;
}

interface LocalizationAuditResult {
  totalStrings: number;
  files: Array<{
    file: string;
    strings: HardcodedString[];
  }>;
  suggestions: Array<{
    key: string;
    value: string;
    files: string[];
  }>;
}

class LocalizationAuditor {
  private hardcodedStrings: HardcodedString[] = [];
  private translationSuggestions: Map<string, { value: string; files: string[] }> = new Map();

  // Patterns to match hardcoded strings
  private patterns = {
    // String literals in JSX
    jsxString: /['"`]([A-Z][a-zA-Z\s]{2,})['"`]/g,
    // Template literals
    templateString: /`([A-Z][a-zA-Z\s]{2,})`/g,
    // String literals in code
    codeString: /['"`]([A-Z][a-zA-Z\s]{2,})['"`]/g,
  };

  // Strings to ignore (common patterns that shouldn't be translated)
  private ignorePatterns = [
    /^[A-Z][a-z]+[A-Z]/, // PascalCase (component names, etc.)
    /^[a-z]+[A-Z]/, // camelCase
    /^[a-z_]+$/, // snake_case
    /^\d+$/, // Numbers
    /^[A-Z_]+$/, // CONSTANTS
    /^(className|id|key|type|name|value|href|src|alt|title|aria-label|aria-describedby|role|data-)/, // HTML attributes
    /^(px|rem|em|%|vh|vw|pt|pc|in|cm|mm)$/, // CSS units
    /^(true|false|null|undefined)$/, // JavaScript literals
    /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/, // HTTP methods
    /^(rgb|rgba|hsl|hsla|hex)$/, // Color formats
    /^(solid|dashed|dotted|double|groove|ridge|inset|outset)$/, // CSS border styles
    /^(left|right|center|justify|start|end)$/, // CSS alignment
    /^(block|inline|flex|grid|table|none)$/, // CSS display
    /^(static|relative|absolute|fixed|sticky)$/, // CSS position
    /^(auto|scroll|hidden|visible)$/, // CSS overflow
    /^(normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900)$/, // CSS font-weight
    /^(italic|normal|oblique)$/, // CSS font-style
    /^(uppercase|lowercase|capitalize|none)$/, // CSS text-transform
    /^(underline|overline|line-through|none)$/, // CSS text-decoration
    /^(nowrap|wrap|wrap-reverse)$/, // CSS flex-wrap
    /^(row|column|row-reverse|column-reverse)$/, // CSS flex-direction
    /^(start|end|center|space-between|space-around|space-evenly)$/, // CSS justify-content
    /^(stretch|flex-start|flex-end|center|baseline)$/, // CSS align-items
    /^(auto|0|1|2|3|4|5|6|7|8|9|10|11|12)$/, // Common numeric values
  ];

  // Common translation key patterns
  private keyPatterns = {
    button: (text: string) => `buttons.${this.toCamelCase(text)}`,
    label: (text: string) => `labels.${this.toCamelCase(text)}`,
    placeholder: (text: string) => `placeholders.${this.toCamelCase(text)}`,
    title: (text: string) => `titles.${this.toCamelCase(text)}`,
    message: (text: string) => `messages.${this.toCamelCase(text)}`,
    error: (text: string) => `errors.${this.toCamelCase(text)}`,
    success: (text: string) => `success.${this.toCamelCase(text)}`,
    warning: (text: string) => `warnings.${this.toCamelCase(text)}`,
    info: (text: string) => `info.${this.toCamelCase(text)}`,
    aria: (text: string) => `aria.${this.toCamelCase(text)}`,
    common: (text: string) => `common.${this.toCamelCase(text)}`,
  };

  private toCamelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  }

  private shouldIgnore(str: string): boolean {
    return this.ignorePatterns.some(pattern => pattern.test(str));
  }

  private generateKey(text: string, context: string): string {
    const cleanText = text.trim();
    
    // Determine key pattern based on context
    if (context.includes('button') || context.includes('Button')) {
      return this.keyPatterns.button(cleanText);
    }
    if (context.includes('label') || context.includes('Label')) {
      return this.keyPatterns.label(cleanText);
    }
    if (context.includes('placeholder') || context.includes('Placeholder')) {
      return this.keyPatterns.placeholder(cleanText);
    }
    if (context.includes('title') || context.includes('Title')) {
      return this.keyPatterns.title(cleanText);
    }
    if (context.includes('error') || context.includes('Error')) {
      return this.keyPatterns.error(cleanText);
    }
    if (context.includes('success') || context.includes('Success')) {
      return this.keyPatterns.success(cleanText);
    }
    if (context.includes('warning') || context.includes('Warning')) {
      return this.keyPatterns.warning(cleanText);
    }
    if (context.includes('aria') || context.includes('Aria')) {
      return this.keyPatterns.aria(cleanText);
    }
    
    // Default to common
    return this.keyPatterns.common(cleanText);
  }

  private scanFile(filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Skip comments and imports
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('import')) {
          return;
        }

        // Check for JSX strings
        const jsxMatches = line.matchAll(this.patterns.jsxString);
        for (const match of jsxMatches) {
          const text = match[1];
          if (!this.shouldIgnore(text)) {
            const suggestedKey = this.generateKey(text, line);
            this.hardcodedStrings.push({
              file: filePath,
              line: index + 1,
              content: text,
              type: 'jsx',
              suggestedKey,
            });
            this.addTranslationSuggestion(suggestedKey, text, filePath);
          }
        }

        // Check for template strings
        const templateMatches = line.matchAll(this.patterns.templateString);
        for (const match of templateMatches) {
          const text = match[1];
          if (!this.shouldIgnore(text)) {
            const suggestedKey = this.generateKey(text, line);
            this.hardcodedStrings.push({
              file: filePath,
              line: index + 1,
              content: text,
              type: 'template',
              suggestedKey,
            });
            this.addTranslationSuggestion(suggestedKey, text, filePath);
          }
        }
      });
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error);
    }
  }

  private addTranslationSuggestion(key: string, value: string, file: string): void {
    const existing = this.translationSuggestions.get(key);
    if (existing) {
      if (!existing.files.includes(file)) {
        existing.files.push(file);
      }
    } else {
      this.translationSuggestions.set(key, {
        value,
        files: [file],
      });
    }
  }

  private scanDirectory(dirPath: string): void {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other common directories
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
            this.scanDirectory(fullPath);
          }
        } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js'))) {
          this.scanFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }
  }

  public audit(scanPath: string): LocalizationAuditResult {
    this.hardcodedStrings = [];
    this.translationSuggestions.clear();

    if (fs.statSync(scanPath).isDirectory()) {
      this.scanDirectory(scanPath);
    } else {
      this.scanFile(scanPath);
    }

    // Group strings by file
    const filesMap = new Map<string, HardcodedString[]>();
    this.hardcodedStrings.forEach(str => {
      if (!filesMap.has(str.file)) {
        filesMap.set(str.file, []);
      }
      filesMap.get(str.file)!.push(str);
    });

    const files = Array.from(filesMap.entries()).map(([file, strings]) => ({
      file,
      strings,
    }));

    const suggestions = Array.from(this.translationSuggestions.entries()).map(([key, data]) => ({
      key,
      value: data.value,
      files: data.files,
    }));

    return {
      totalStrings: this.hardcodedStrings.length,
      files,
      suggestions,
    };
  }

  public generateTranslationFile(suggestions: Array<{ key: string; value: string; files: string[] }>): string {
    const translations: Record<string, string> = {};
    
    suggestions.forEach(({ key, value }) => {
      // Create nested object structure
      const keys = key.split('.');
      let current = translations;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {} as any;
        }
        current = current[keys[i]] as any;
      }
      
      current[keys[keys.length - 1]] = value as any;
    });

    return JSON.stringify(translations, null, 2);
  }

  public generateReplacementSuggestions(): string {
    let output = '# Localization Replacement Suggestions\n\n';
    
    this.hardcodedStrings.forEach((str, index) => {
      output += `## ${index + 1}. ${path.basename(str.file)}:${str.line}\n`;
      output += `**Original:** \`${str.content}\`\n`;
      output += `**Suggested Key:** \`${str.suggestedKey}\`\n`;
      output += `**Replacement:** \`{t('${str.suggestedKey}')}\`\n\n`;
    });

    return output;
  }
}

// Usage example
export const auditLocalization = (scanPath: string = './src'): LocalizationAuditResult => {
  const auditor = new LocalizationAuditor();
  return auditor.audit(scanPath);
};

export const generateMissingTranslations = (scanPath: string = './src'): string => {
  const auditor = new LocalizationAuditor();
  const result = auditor.audit(scanPath);
  return auditor.generateTranslationFile(result.suggestions);
};

export const generateReplacementGuide = (scanPath: string = './src'): string => {
  const auditor = new LocalizationAuditor();
  auditor.audit(scanPath);
  return auditor.generateReplacementSuggestions();
};

export default LocalizationAuditor;
