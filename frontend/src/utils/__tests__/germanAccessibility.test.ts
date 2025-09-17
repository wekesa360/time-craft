import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  GermanAccessibilityManager,
  germanAccessibility,
  initializeGermanAccessibility,
  announceLanguageChange,
  updateGermanAccessibilityLanguage,
  getGermanAccessibilityStatus,
} from "../germanAccessibility";

// Mock DOM methods
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemove = vi.fn();
const mockQuerySelector = vi.fn();
const mockQuerySelectorAll = vi.fn();
const mockGetElementById = vi.fn();
const mockMatchMedia = vi.fn();

// Setup DOM mocks
beforeEach(() => {
  vi.clearAllMocks();

  // Mock document
  Object.defineProperty(global, "document", {
    value: {
      createElement: mockCreateElement,
      head: { appendChild: mockAppendChild },
      body: {
        appendChild: mockAppendChild,
        insertBefore: vi.fn(),
      },
      documentElement: {
        lang: "en",
        setAttribute: vi.fn(),
      },
      querySelector: mockQuerySelector,
      querySelectorAll: mockQuerySelectorAll,
      getElementById: mockGetElementById,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    writable: true,
  });

  // Mock window
  Object.defineProperty(global, "window", {
    value: {
      matchMedia: mockMatchMedia,
      speechSynthesis: {},
    },
    writable: true,
  });

  // Mock element creation
  mockCreateElement.mockReturnValue({
    id: "",
    className: "",
    textContent: "",
    innerHTML: "",
    style: {},
    setAttribute: vi.fn(),
    appendChild: vi.fn(),
    remove: mockRemove,
  });

  // Mock media queries
  mockMatchMedia.mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GermanAccessibilityManager", () => {
  describe("Constructor and Configuration", () => {
    it("creates instance with default config", () => {
      const manager = new GermanAccessibilityManager();
      expect(manager).toBeInstanceOf(GermanAccessibilityManager);
    });

    it("creates instance with custom config", () => {
      const config = {
        enableScreenReaderSupport: false,
        enableKeyboardNavigation: true,
        enableHighContrastMode: false,
        announceLanguageChanges: true,
        enableAriaLabels: false,
      };

      const manager = new GermanAccessibilityManager(config);
      expect(manager).toBeInstanceOf(GermanAccessibilityManager);
    });

    it("returns singleton instance", () => {
      const instance1 = GermanAccessibilityManager.getInstance();
      const instance2 = GermanAccessibilityManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("updates configuration", () => {
      const manager = new GermanAccessibilityManager();
      const newConfig = { enableScreenReaderSupport: false };

      manager.updateConfig(newConfig);
      expect(manager).toBeInstanceOf(GermanAccessibilityManager);
    });
  });

  describe("Initialization", () => {
    it("initializes with English language", () => {
      const manager = new GermanAccessibilityManager();
      manager.initialize("en");

      expect(global.document.documentElement.lang).toBe("en");
    });

    it("initializes with German language", () => {
      const manager = new GermanAccessibilityManager();
      manager.initialize("de");

      expect(global.document.documentElement.lang).toBe("de");
    });

    it("sets up screen reader support when enabled", () => {
      const manager = new GermanAccessibilityManager({
        enableScreenReaderSupport: true,
      });

      manager.initialize("de");

      expect(mockCreateElement).toHaveBeenCalledWith("style");
      expect(mockAppendChild).toHaveBeenCalled();
    });

    it("sets up keyboard navigation when enabled", () => {
      const manager = new GermanAccessibilityManager({
        enableKeyboardNavigation: true,
      });

      manager.initialize("de");

      expect(mockCreateElement).toHaveBeenCalledWith("style");
    });

    it("sets up high contrast mode when enabled", () => {
      const manager = new GermanAccessibilityManager({
        enableHighContrastMode: true,
      });

      manager.initialize("de");

      expect(mockCreateElement).toHaveBeenCalledWith("style");
    });
  });

  describe("Screen Reader Support", () => {
    it("creates screen reader styles", () => {
      const manager = new GermanAccessibilityManager();
      manager.initialize("de");

      const styleElement = mockCreateElement.mock.results[0].value;
      expect(styleElement.id).toBe("german-screen-reader-styles");
      expect(styleElement.textContent).toContain(".sr-only");
      expect(styleElement.textContent).toContain('[lang="de"]');
    });

    it("removes existing styles before adding new ones", () => {
      mockGetElementById.mockReturnValue({
        remove: mockRemove,
      });

      const manager = new GermanAccessibilityManager();
      manager.initialize("de");

      expect(mockGetElementById).toHaveBeenCalledWith(
        "german-screen-reader-styles"
      );
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe("Keyboard Navigation", () => {
    it("adds keyboard navigation styles", () => {
      const manager = new GermanAccessibilityManager({
        enableKeyboardNavigation: true,
      });

      manager.initialize("de");

      expect(mockCreateElement).toHaveBeenCalledWith("style");
      const styleElement = mockCreateElement.mock.results.find(
        (result) => result.value.id === "german-keyboard-navigation"
      );
      expect(styleElement).toBeDefined();
    });

    it("adds skip links for German interface", () => {
      const manager = new GermanAccessibilityManager({
        enableKeyboardNavigation: true,
      });

      manager.initialize("de");

      expect(mockCreateElement).toHaveBeenCalledWith("div");
      const skipLinksContainer = mockCreateElement.mock.results.find(
        (result) => result.value.id === "german-skip-links"
      );
      expect(skipLinksContainer).toBeDefined();
    });

    it("does not add skip links for non-German language", () => {
      const manager = new GermanAccessibilityManager({
        enableKeyboardNavigation: true,
      });

      manager.initialize("en");

      const skipLinksContainer = mockCreateElement.mock.results.find(
        (result) => result.value.id === "german-skip-links"
      );
      expect(skipLinksContainer).toBeUndefined();
    });
  });

  describe("High Contrast Mode", () => {
    it("adds high contrast styles", () => {
      const manager = new GermanAccessibilityManager({
        enableHighContrastMode: true,
      });

      manager.initialize("de");

      const styleElement = mockCreateElement.mock.results.find(
        (result) => result.value.id === "german-high-contrast"
      );
      expect(styleElement).toBeDefined();
      expect(styleElement.value.textContent).toContain(
        "@media (prefers-contrast: high)"
      );
      expect(styleElement.value.textContent).toContain(
        "@media (forced-colors: active)"
      );
    });

    it("includes German-specific high contrast rules", () => {
      const manager = new GermanAccessibilityManager({
        enableHighContrastMode: true,
      });

      manager.initialize("de");

      const styleElement = mockCreateElement.mock.results.find(
        (result) => result.value.id === "german-high-contrast"
      );
      expect(styleElement.value.textContent).toContain('[lang="de"]');
      expect(styleElement.value.textContent).toContain(".compound-word");
    });
  });

  describe("ARIA Labels", () => {
    it("updates ARIA labels for German content", () => {
      mockQuerySelectorAll.mockReturnValue([
        { setAttribute: vi.fn() },
        { setAttribute: vi.fn() },
      ]);

      const manager = new GermanAccessibilityManager({
        enableAriaLabels: true,
      });

      manager.initialize("de");

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('[aria-label="Close"]');
    });

    it("does not update ARIA labels for non-German language", () => {
      const manager = new GermanAccessibilityManager({
        enableAriaLabels: true,
      });

      manager.initialize("en");

      // Should not query for ARIA labels to update
      expect(mockQuerySelectorAll).not.toHaveBeenCalledWith(
        '[aria-label="Close"]'
      );
    });

    it("adds German ARIA descriptions", () => {
      mockQuerySelectorAll.mockReturnValue([
        {
          getAttribute: vi.fn().mockReturnValue(null),
          setAttribute: vi.fn(),
          appendChild: vi.fn(),
        },
      ]);

      const manager = new GermanAccessibilityManager({
        enableAriaLabels: true,
      });

      manager.initialize("de");

      expect(mockQuerySelectorAll).toHaveBeenCalledWith(
        ".compound-word, .german-compound-word"
      );
    });
  });

  describe("Language Announcements", () => {
    it("announces language change to German", () => {
      const manager = new GermanAccessibilityManager({
        announceLanguageChanges: true,
      });

      manager.announceLanguageChange("de", "Deutsch");

      expect(mockCreateElement).toHaveBeenCalledWith("div");
      const announcement = mockCreateElement.mock.results[0].value;
      expect(announcement.className).toBe("language-announcement");
      expect(announcement.textContent).toBe(
        "Sprache wurde zu Deutsch geändert"
      );
    });

    it("announces language change to English", () => {
      const manager = new GermanAccessibilityManager({
        announceLanguageChanges: true,
      });

      manager.announceLanguageChange("en", "English");

      const announcement = mockCreateElement.mock.results[0].value;
      expect(announcement.textContent).toBe("Language changed to English");
    });

    it("does not announce when disabled", () => {
      const manager = new GermanAccessibilityManager({
        announceLanguageChanges: false,
      });

      manager.announceLanguageChange("de", "Deutsch");

      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it("removes announcement after timeout", (done) => {
      const manager = new GermanAccessibilityManager({
        announceLanguageChanges: true,
      });

      const mockParentNode = {
        removeChild: vi.fn(),
      };

      mockCreateElement.mockReturnValue({
        className: "",
        textContent: "",
        setAttribute: vi.fn(),
        parentNode: mockParentNode,
      });

      manager.announceLanguageChange("de", "Deutsch");

      setTimeout(() => {
        expect(mockParentNode.removeChild).toHaveBeenCalled();
        done();
      }, 3100); // Slightly more than the 3000ms timeout
    });
  });

  describe("Language Updates", () => {
    it("updates language and refreshes features", () => {
      const manager = new GermanAccessibilityManager();
      manager.updateLanguage("de");

      expect(global.document.documentElement.lang).toBe("de");
    });

    it("announces language change when updating", () => {
      const manager = new GermanAccessibilityManager({
        announceLanguageChanges: true,
      });

      manager.updateLanguage("de");

      expect(mockCreateElement).toHaveBeenCalledWith("div");
    });
  });

  describe("Accessibility Support Detection", () => {
    it("checks screen reader support", () => {
      Object.defineProperty(global.window, "speechSynthesis", {
        value: {},
        writable: true,
      });

      const manager = new GermanAccessibilityManager();
      const support = manager.checkAccessibilitySupport();

      expect(support.screenReader).toBe(true);
    });

    it("checks high contrast support", () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      const manager = new GermanAccessibilityManager();
      const support = manager.checkAccessibilitySupport();

      expect(support.highContrast).toBe(true);
    });

    it("checks reduced motion support", () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query.includes("prefers-reduced-motion"),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const manager = new GermanAccessibilityManager();
      const support = manager.checkAccessibilitySupport();

      expect(support.reducedMotion).toBe(true);
    });

    it("checks forced colors support", () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: query.includes("forced-colors"),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const manager = new GermanAccessibilityManager();
      const support = manager.checkAccessibilitySupport();

      expect(support.forcedColors).toBe(true);
    });
  });

  describe("Status Reporting", () => {
    it("returns accessibility status", () => {
      const manager = new GermanAccessibilityManager({
        enableScreenReaderSupport: true,
        enableKeyboardNavigation: true,
        enableHighContrastMode: false,
        enableAriaLabels: true,
      });

      manager.initialize("de");
      const status = manager.getAccessibilityStatus();

      expect(status.isGerman).toBe(true);
      expect(status.hasScreenReaderSupport).toBe(true);
      expect(status.hasKeyboardNavigation).toBe(true);
      expect(status.hasHighContrastMode).toBe(false);
      expect(status.hasAriaLabels).toBe(true);
      expect(status.environmentSupport).toBeDefined();
    });
  });

  describe("Cleanup", () => {
    it("removes all accessibility features", () => {
      mockGetElementById
        .mockReturnValueOnce({ remove: mockRemove })
        .mockReturnValueOnce({ remove: mockRemove })
        .mockReturnValueOnce({ remove: mockRemove })
        .mockReturnValueOnce(null);

      mockQuerySelectorAll.mockReturnValue([
        { parentNode: { removeChild: vi.fn() } },
      ]);

      const manager = new GermanAccessibilityManager();
      manager.cleanup();

      expect(mockGetElementById).toHaveBeenCalledWith(
        "german-screen-reader-styles"
      );
      expect(mockGetElementById).toHaveBeenCalledWith(
        "german-keyboard-navigation"
      );
      expect(mockGetElementById).toHaveBeenCalledWith("german-high-contrast");
      expect(mockGetElementById).toHaveBeenCalledWith("german-skip-links");
      expect(mockQuerySelectorAll).toHaveBeenCalledWith(
        ".language-announcement"
      );
    });
  });
});

describe("Exported Utility Functions", () => {
  it("initializeGermanAccessibility works", () => {
    const result = initializeGermanAccessibility("de", {
      enableScreenReaderSupport: true,
    });

    expect(result).toBeInstanceOf(GermanAccessibilityManager);
  });

  it("announceLanguageChange works", () => {
    announceLanguageChange("de", "Deutsch");
    expect(mockCreateElement).toHaveBeenCalledWith("div");
  });

  it("updateGermanAccessibilityLanguage works", () => {
    updateGermanAccessibilityLanguage("de");
    expect(global.document.documentElement.lang).toBe("de");
  });

  it("getGermanAccessibilityStatus works", () => {
    const status = getGermanAccessibilityStatus();
    expect(status).toHaveProperty("isGerman");
    expect(status).toHaveProperty("hasScreenReaderSupport");
    expect(status).toHaveProperty("environmentSupport");
  });
});

describe("Edge Cases and Error Handling", () => {
  it("handles missing DOM elements gracefully", () => {
    mockQuerySelectorAll.mockReturnValue([]);
    mockGetElementById.mockReturnValue(null);

    const manager = new GermanAccessibilityManager();
    expect(() => manager.initialize("de")).not.toThrow();
    expect(() => manager.cleanup()).not.toThrow();
  });

  it("handles missing speechSynthesis", () => {
    delete (global.window as any).speechSynthesis;

    const manager = new GermanAccessibilityManager();
    const support = manager.checkAccessibilitySupport();

    expect(support.screenReader).toBe(false);
  });

  it("handles matchMedia not supported", () => {
    delete (global.window as any).matchMedia;

    const manager = new GermanAccessibilityManager();
    expect(() => manager.checkAccessibilitySupport()).not.toThrow();
  });

  it("handles null parent nodes in cleanup", () => {
    mockQuerySelectorAll.mockReturnValue([{ parentNode: null }]);

    const manager = new GermanAccessibilityManager();
    expect(() => manager.cleanup()).not.toThrow();
  });
});
