import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  GermanAccessibilityProvider,
  useGermanAccessibilityContext,
  GermanAccessibleButton,
  GermanAccessibleInput,
  GermanAccessibleNavigation,
  GermanAccessibleMain,
  GermanAccessibleModal
} from '../accessibility/GermanAccessibilityProvider';
import { 
  useGermanAccessibilityFeatures,
  useGermanKeyboardNavigation,
  useGermanHighContrast
} from '../../hooks/useGermanAccessibility';
import { Eye, EyeOff, Keyboard, Volume2, Monitor, AlertCircle, CheckCircle } from 'lucide-react';

const GermanAccessibilityDemoContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const testInputRef = useRef<HTMLInputElement>(null);

  const {
    isGerman,
    accessibilityStatus,
    keyboardShortcuts,
    isHighContrast,
    isForcedColors,
    announceToScreenReader,
    getAccessibilityAttributes
  } = useGermanAccessibilityContext();

  const { needsHighContrastSupport, getHighContrastStyles } = useGermanHighContrast();
  const { announceToScreenReader: announce } = useGermanAccessibilityFeatures();

  const handleTestAnnouncement = () => {
    const message = isGerman 
      ? 'Dies ist eine Testansage für Bildschirmleser'
      : 'This is a test announcement for screen readers';
    announceToScreenReader(message, 'polite');
  };

  const handleFocusTest = () => {
    if (testInputRef.current) {
      testInputRef.current.focus();
      const message = isGerman 
        ? 'Fokus wurde auf das Testfeld gesetzt'
        : 'Focus was set to the test field';
      announce(message);
    }
  };

  const testKeyboardNavigation = () => {
    const message = isGerman
      ? 'Tastaturnavigation wird getestet. Verwenden Sie Tab, um durch die Elemente zu navigieren.'
      : 'Testing keyboard navigation. Use Tab to navigate through elements.';
    announce(message, 'assertive');
  };

  if (!isGerman) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">German Accessibility Demo</h2>
        <p className="text-foreground-secondary">
          Switch to German language to see the accessibility features in action.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Accessibility Status Card */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Eye className="w-6 h-6 text-primary-500" />
          <h2 className="text-lg font-semibold">Barrierefreiheitsstatus</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            {accessibilityStatus.hasScreenReaderSupport ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm">Bildschirmleser-Unterstützung</span>
          </div>

          <div className="flex items-center space-x-2">
            {accessibilityStatus.hasKeyboardNavigation ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm">Tastaturnavigation</span>
          </div>

          <div className="flex items-center space-x-2">
            {accessibilityStatus.hasHighContrastMode ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm">Hoher Kontrast</span>
          </div>

          <div className="flex items-center space-x-2">
            {accessibilityStatus.hasAriaLabels ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm">ARIA-Beschriftungen</span>
          </div>

          <div className="flex items-center space-x-2">
            {isHighContrast ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm">Hoher Kontrast aktiv</span>
          </div>

          <div className="flex items-center space-x-2">
            {isForcedColors ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm">Erzwungene Farben</span>
          </div>
        </div>

        {needsHighContrastSupport && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <Monitor className="w-4 h-4 inline mr-2" />
              Ihr System verwendet Hochkontrast- oder erzwungene Farbmodi. 
              Die Benutzeroberfläche wurde entsprechend angepasst.
            </p>
          </div>
        )}
      </div>

      {/* Screen Reader Test */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Volume2 className="w-6 h-6 text-primary-500" />
          <h3 className="text-lg font-semibold">Bildschirmleser-Test</h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-foreground-secondary">
            Testen Sie die Bildschirmleser-Funktionalität mit den folgenden Schaltflächen:
          </p>

          <div className="flex flex-wrap gap-3">
            <GermanAccessibleButton
              onClick={handleTestAnnouncement}
              className="btn-primary"
              ariaLabel="Testansage für Bildschirmleser abspielen"
            >
              Testansage abspielen
            </GermanAccessibleButton>

            <GermanAccessibleButton
              onClick={handleFocusTest}
              className="btn-secondary"
              ariaLabel="Fokus auf Testfeld setzen"
            >
              Fokus testen
            </GermanAccessibleButton>
          </div>

          <div className="mt-4">
            <label htmlFor="test-input" className="block text-sm font-medium mb-2">
              Testfeld für Bildschirmleser:
            </label>
            <GermanAccessibleInput
              ref={testInputRef}
              id="test-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Geben Sie hier Text ein..."
              className="w-full p-2 border rounded"
              ariaLabel="Testfeld für Bildschirmleser-Eingabe"
              ariaDescribedBy="test-input-help"
            />
            <p id="test-input-help" className="text-xs text-foreground-secondary mt-1">
              Dieses Feld wird von Bildschirmlesern mit deutschen Beschriftungen angekündigt.
            </p>
          </div>
        </div>
      </div>

      {/* Keyboard Navigation Test */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Keyboard className="w-6 h-6 text-primary-500" />
          <h3 className="text-lg font-semibold">Tastaturnavigation</h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-foreground-secondary">
            Die folgenden Tastenkombinationen sind verfügbar:
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(keyboardShortcuts).map(([key, description]) => (
                <div key={key} className="flex justify-between">
                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                    {key}
                  </code>
                  <span className="ml-2">{description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <GermanAccessibleButton
              onClick={testKeyboardNavigation}
              className="btn-primary"
              ariaLabel="Tastaturnavigation testen"
            >
              Navigation testen
            </GermanAccessibleButton>

            <GermanAccessibleButton
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="btn-secondary"
              ariaLabel="Tastenkombinationen anzeigen oder ausblenden"
            >
              {showKeyboardShortcuts ? 'Shortcuts ausblenden' : 'Shortcuts anzeigen'}
            </GermanAccessibleButton>
          </div>

          {showKeyboardShortcuts && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium mb-2">Zusätzliche Tastenkombinationen:</h4>
              <ul className="text-sm space-y-1">
                <li><code>Tab</code> - Zum nächsten Element</li>
                <li><code>Shift + Tab</code> - Zum vorherigen Element</li>
                <li><code>Enter</code> - Element aktivieren</li>
                <li><code>Escape</code> - Dialog schließen</li>
                <li><code>Pfeil-Tasten</code> - In Listen navigieren</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* High Contrast Mode Test */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Monitor className="w-6 h-6 text-primary-500" />
          <h3 className="text-lg font-semibold">Hochkontrast-Modus</h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-foreground-secondary">
            Diese Elemente werden im Hochkontrast-Modus optimiert dargestellt:
          </p>

          <div className="space-y-3">
            <div 
              className="p-3 border rounded"
              style={getHighContrastStyles(true)}
            >
              <h4 className="font-medium">Beispiel-Überschrift</h4>
              <p className="text-sm mt-1">
                Dieser Text wird im Hochkontrast-Modus mit optimierter Darstellung angezeigt.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <GermanAccessibleButton
                onClick={() => {}}
                className="btn-primary"
                ariaLabel="Hochkontrast-Schaltfläche"
              >
                Primäre Schaltfläche
              </GermanAccessibleButton>

              <GermanAccessibleButton
                onClick={() => {}}
                className="btn-secondary"
                ariaLabel="Sekundäre Hochkontrast-Schaltfläche"
              >
                Sekundäre Schaltfläche
              </GermanAccessibleButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <GermanAccessibleInput
                placeholder="Hochkontrast-Eingabefeld"
                className="p-2 border rounded"
                ariaLabel="Eingabefeld für Hochkontrast-Test"
              />
              
              <select 
                className="p-2 border rounded"
                style={getHighContrastStyles(true)}
                aria-label="Auswahl für Hochkontrast-Test"
              >
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Test */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <EyeOff className="w-6 h-6 text-primary-500" />
          <h3 className="text-lg font-semibold">Barrierefreier Dialog</h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-foreground-secondary">
            Testen Sie einen barrierefreien Dialog mit deutscher Sprachunterstützung:
          </p>

          <GermanAccessibleButton
            onClick={() => setShowModal(true)}
            className="btn-primary"
            ariaLabel="Barrierefreien Dialog öffnen"
          >
            Dialog öffnen
          </GermanAccessibleButton>
        </div>
      </div>

      {/* Accessible Modal */}
      <GermanAccessibleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Barrierefreier Dialog"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p>
            Dies ist ein barrierefreier Dialog mit deutscher Sprachunterstützung. 
            Er enthält:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Fokus-Management</li>
            <li>Tastatur-Navigation</li>
            <li>Bildschirmleser-Ansagen</li>
            <li>ARIA-Beschriftungen</li>
            <li>Escape-Taste zum Schließen</li>
          </ul>
          
          <div className="flex justify-end space-x-3 mt-6">
            <GermanAccessibleButton
              onClick={() => setShowModal(false)}
              className="btn-secondary"
              ariaLabel="Dialog abbrechen"
            >
              Abbrechen
            </GermanAccessibleButton>
            <GermanAccessibleButton
              onClick={() => setShowModal(false)}
              className="btn-primary"
              ariaLabel="Dialog bestätigen"
            >
              Bestätigen
            </GermanAccessibleButton>
          </div>
        </div>
      </GermanAccessibleModal>

      {/* Navigation Example */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Barrierefreie Navigation</h3>
        
        <GermanAccessibleNavigation 
          className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
          ariaLabel="Beispiel-Navigation"
        >
          <ul className="flex flex-wrap gap-4">
            <li>
              <a 
                href="#" 
                className="text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Startseite aufrufen"
              >
                Startseite
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Einstellungen aufrufen"
              >
                Einstellungen
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Hilfe aufrufen"
              >
                Hilfe
              </a>
            </li>
          </ul>
        </GermanAccessibleNavigation>
      </div>
    </div>
  );
};

export const GermanAccessibilityDemo: React.FC = () => {
  return (
    <GermanAccessibilityProvider
      enableKeyboardShortcuts={true}
      enableHighContrastMode={true}
      enableScreenReaderSupport={true}
    >
      <GermanAccessibilityDemoContent />
    </GermanAccessibilityProvider>
  );
};