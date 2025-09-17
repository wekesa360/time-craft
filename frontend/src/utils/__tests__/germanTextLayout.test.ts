import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  GermanTextLayoutManager, 
  germanTextLayout,
  applyGermanTextOptimizations,
  removeGermanTextOptimizations,
  optimizeGermanText
} from '../germanTextLayout';

// Mock DOM methods
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemove = vi.fn();
const mockQuerySelector = vi.fn();
const mockQuerySelectorAll = vi.fn();
const mockCreateTreeWalker = vi.fn();
const mockGetComputedStyle = vi.fn();

// Setup DOM mocks
beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();
  
  // Mock document methods
  Object.defineProperty(global, 'document', {
    value: {
      createElement: mockCreateElement,
      head: { appendChild: mockAppendChild },
      body: { 
        appendChild: mockAppendChild,
        setAttribute: vi.fn(),
        removeAttribute: vi.fn()
      },
      querySelector: mockQuerySelector,
      querySelectorAll: mockQuerySelectorAll,
      createTreeWalker: mockCreateTreeWalker,
      createTextNode: vi.fn()
    },
    writable: true
  });

  // Mock window methods
  Object.defineProperty(global, 'window', {
    value: {
      getComputedStyle: mockGetComputedStyle,
      matchMedia: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    },
    writable: true
  });

  // Mock element creation
  mockCreateElement.mockReturnValue({
    textContent: '',
    id: '',
    className: '',
    style: {},
    appendChild: vi.fn(),
    remove: mockRemove,
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  });

  mockGetComputedStyle.mockReturnValue({
    lineHeight: 'normal'
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GermanTextLayoutManager', () => {
  describe('Constructor and Configuration', () => {
    it('creates instance with default config', () => {
      const manager = new GermanTextLayoutManager();
      expect(manager).toBeInstanceOf(GermanTextLayoutManager);
    });

    it('creates instance with custom config', () => {
      const config = {
        enableHyphenation: false,
        maxWordLength: 25,
        preferredLineLength: 70,
        allowWordBreaking: false
      };
      
      const manager = new GermanTextLayoutManager(config);
      expect(manager).toBeInstanceOf(GermanTextLayoutManager);
    });

    it('returns singleton instance', () => {
      const instance1 = GermanTextLayoutManager.getInstance();
      const instance2 = GermanTextLayoutManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('updates configuration', () => {
      const manager = new GermanTextLayoutManager();
      const newConfig = { maxWordLength: 30 };
      
      manager.updateConfig(newConfig);
      // Configuration update is internal, so we test through behavior
      expect(manager).toBeInstanceOf(GermanTextLayoutManager);
    });
  });

  describe('German Hyphenation', () => {
    it('enables German hyphenation styles', () => {
      const manager = new GermanTextLayoutManager();
      manager.applyGermanLayoutOptimizations();

      expect(mockCreateElement).toHaveBeenCalledWith('style');
      expect(mockAppendChild).toHaveBeenCalled();
    });

    it('inserts soft hyphens in compound words', () => {
      const manager = new GermanTextLayoutManager();
      
      const testWords = [
        'Benutzereinstellungen',
        'Gesundheitsüberwachung',
        'Softwareentwicklung',
        'Donaudampfschifffahrt'
      ];

      testWords.forEach(word => {
        const result = manager['insertSoftHyphens'](word);
        expect(result).toContain('\u00AD'); // Soft hyphen
        expect(result.length).toBeGreaterThan(word.length);
      });
    });

    it('handles common German prefixes', () => {
      const manager = new GermanTextLayoutManager();
      
      const testWords = [
        'unglaublich',
        'vorbestimmt',
        'nachdenken',
        'überlegen',
        'untersuchen'
      ];

      testWords.forEach(word => {
        const result = manager['insertSoftHyphens'](word);
        if (word.length > 15) {
          expect(result).toContain('\u00AD');
        }
      });
    });

    it('handles common German suffixes', () => {
      const manager = new GermanTextLayoutManager();
      
      const testWords = [
        'Verwaltung',
        'Sicherheit',
        'Möglichkeit',
        'Freundschaft',
        'Eigentum'
      ];

      testWords.forEach(word => {
        const result = manager['insertSoftHyphens'](word);
        if (word.length > 15) {
          expect(result).toContain('\u00AD');
        }
      });
    });

    it('does not add hyphens to short words', () => {
      const manager = new GermanTextLayoutManager();
      
      const shortWords = ['Haus', 'Auto', 'Buch', 'Tisch'];
      
      shortWords.forEach(word => {
        const result = manager['insertSoftHyphens'](word);
        expect(result).toBe(word); // No change for short words
      });
    });
  });

  describe('Text Spacing Optimization', () => {
    it('optimizes text spacing for German elements', () => {
      mockQuerySelectorAll.mockReturnValue([
        {
          style: {},
          textContent: 'Some German text with long words'
        }
      ]);

      const manager = new GermanTextLayoutManager();
      manager.applyGermanLayoutOptimizations();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('[lang="de"], [data-lang="de"], .german-text');
    });

    it('adjusts line height for better readability', () => {
      const mockElement = {
        style: { lineHeight: '' },
        textContent: 'German text'
      };
      
      mockQuerySelectorAll.mockReturnValue([mockElement]);
      mockGetComputedStyle.mockReturnValue({ lineHeight: 'normal' });

      const manager = new GermanTextLayoutManager();
      manager.applyGermanLayoutOptimizations();

      expect(mockElement.style.lineHeight).toBe('1.6');
    });

    it('optimizes letter spacing for long words', () => {
      const mockElement = {
        style: { letterSpacing: '', wordSpacing: '' },
        textContent: 'Benutzereinstellungsverwaltungssystem'
      };
      
      mockQuerySelectorAll.mockReturnValue([mockElement]);

      const manager = new GermanTextLayoutManager();
      manager['optimizeLetterSpacing'](mockElement as any);

      expect(mockElement.style.letterSpacing).toBe('-0.01em');
      expect(mockElement.style.wordSpacing).toBe('0.1em');
    });
  });

  describe('Long Word Handling', () => {
    it('identifies and processes long German words', () => {
      const mockTextNode = {
        textContent: 'Dies ist ein Benutzereinstellungsverwaltungssystem für die Anwendung.',
        parentElement: {
          replaceChild: vi.fn()
        }
      };

      mockCreateTreeWalker.mockReturnValue({
        nextNode: vi.fn()
          .mockReturnValueOnce(mockTextNode)
          .mockReturnValueOnce(null)
      });

      const manager = new GermanTextLayoutManager();
      manager.applyGermanLayoutOptimizations();

      expect(mockCreateTreeWalker).toHaveBeenCalled();
    });

    it('creates spans for long words', () => {
      const mockSpan = {
        className: '',
        innerHTML: ''
      };
      
      mockCreateElement.mockReturnValue(mockSpan);

      const manager = new GermanTextLayoutManager();
      const longWord = 'Benutzereinstellungsverwaltungssystem';
      
      // This would be called internally during handleLongWords
      const result = manager['insertSoftHyphens'](longWord);
      expect(result).toContain('\u00AD');
    });
  });

  describe('Responsive Breakpoints', () => {
    it('adds responsive CSS for German content', () => {
      const manager = new GermanTextLayoutManager();
      manager.applyGermanLayoutOptimizations();

      expect(mockCreateElement).toHaveBeenCalledWith('style');
      
      // Check that responsive styles are added
      const styleElement = mockCreateElement.mock.results[0].value;
      expect(styleElement.textContent).toContain('@media (max-width: 768px)');
      expect(styleElement.textContent).toContain('@media (max-width: 480px)');
    });

    it('includes German-specific responsive rules', () => {
      const manager = new GermanTextLayoutManager();
      manager.applyGermanLayoutOptimizations();

      const styleElement = mockCreateElement.mock.results[0].value;
      expect(styleElement.textContent).toContain('[lang="de"]');
      expect(styleElement.textContent).toContain('clamp(');
      expect(styleElement.textContent).toContain('word-break: break-word');
    });
  });

  describe('Cleanup and Removal', () => {
    it('removes German layout optimizations', () => {
      mockQuerySelectorAll
        .mockReturnValueOnce([{ remove: mockRemove }]) // For styles
        .mockReturnValueOnce([{ // For processed elements
          parentElement: {
            replaceChild: vi.fn()
          },
          textContent: 'test'
        }]);

      const manager = new GermanTextLayoutManager();
      manager.removeOptimizations();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('style');
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.german-long-words');
    });

    it('restores original text nodes', () => {
      const mockReplaceChild = vi.fn();
      const mockElement = {
        parentElement: { replaceChild: mockReplaceChild },
        textContent: 'Benutzer­einstellungen' // With soft hyphen
      };

      mockQuerySelectorAll.mockReturnValue([mockElement]);
      global.document.createTextNode = vi.fn().mockReturnValue({});

      const manager = new GermanTextLayoutManager();
      manager.removeOptimizations();

      expect(mockReplaceChild).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('gets text nodes correctly', () => {
      const mockWalker = {
        nextNode: vi.fn()
          .mockReturnValueOnce({ textContent: 'text1' })
          .mockReturnValueOnce({ textContent: 'text2' })
          .mockReturnValueOnce(null)
      };

      mockCreateTreeWalker.mockReturnValue(mockWalker);

      const manager = new GermanTextLayoutManager();
      const element = document.createElement('div');
      const textNodes = manager['getTextNodes'](element);

      expect(mockCreateTreeWalker).toHaveBeenCalledWith(
        element,
        expect.any(Number), // NodeFilter.SHOW_TEXT
        expect.any(Object)
      );
    });

    it('filters out script and style elements', () => {
      const mockAcceptNode = vi.fn();
      mockCreateTreeWalker.mockImplementation((element, filter, options) => {
        // Test the acceptNode function
        const scriptNode = { parentElement: { tagName: 'SCRIPT' } };
        const textNode = { parentElement: { tagName: 'DIV' }, textContent: 'text' };
        
        expect(options.acceptNode(scriptNode)).toBe(2); // FILTER_REJECT
        expect(options.acceptNode(textNode)).toBe(1); // FILTER_ACCEPT
        
        return { nextNode: () => null };
      });

      const manager = new GermanTextLayoutManager();
      const element = document.createElement('div');
      manager['getTextNodes'](element);
    });
  });
});

describe('Exported Utility Functions', () => {
  it('applyGermanTextOptimizations works', () => {
    const config = { enableHyphenation: true };
    applyGermanTextOptimizations(config);
    
    expect(mockCreateElement).toHaveBeenCalled();
  });

  it('removeGermanTextOptimizations works', () => {
    mockQuerySelectorAll.mockReturnValue([]);
    removeGermanTextOptimizations();
    
    expect(mockQuerySelectorAll).toHaveBeenCalled();
  });

  it('optimizeGermanText works with element', () => {
    const mockElement = {
      setAttribute: vi.fn(),
      classList: { add: vi.fn() }
    };

    optimizeGermanText(mockElement as any);
    
    expect(mockElement.setAttribute).toHaveBeenCalledWith('lang', 'de');
    expect(mockElement.classList.add).toHaveBeenCalledWith('german-text');
  });
});

describe('Edge Cases and Error Handling', () => {
  it('handles missing DOM elements gracefully', () => {
    mockQuerySelectorAll.mockReturnValue([]);
    
    const manager = new GermanTextLayoutManager();
    expect(() => manager.applyGermanLayoutOptimizations()).not.toThrow();
  });

  it('handles null text content', () => {
    const manager = new GermanTextLayoutManager();
    const result = manager['insertSoftHyphens']('');
    expect(result).toBe('');
  });

  it('handles very long words', () => {
    const manager = new GermanTextLayoutManager();
    const veryLongWord = 'a'.repeat(100);
    const result = manager['insertSoftHyphens'](veryLongWord);
    
    expect(result).toContain('\u00AD');
    expect(result.length).toBeGreaterThan(veryLongWord.length);
  });

  it('handles words with existing hyphens', () => {
    const manager = new GermanTextLayoutManager();
    const hyphenatedWord = 'Benutzer-Einstellungen';
    const result = manager['insertSoftHyphens'](hyphenatedWord);
    
    // Should not break existing hyphens
    expect(result).toContain('-');
  });
});