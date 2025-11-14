import React from 'react';
import { EnhancedAppearanceSection } from '../components/settings/EnhancedAppearanceSection';
import { Palette, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AppearanceDemoPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link 
            to="/settings" 
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Link>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3">
            <Palette className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Enhanced Appearance</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Customize your app's look and feel with advanced appearance options. 
            See changes applied in real-time as you adjust settings.
          </p>
        </div>

        {/* Enhanced Appearance Section */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <EnhancedAppearanceSection />
        </div>

        {/* Demo Content to Show Changes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Typography Demo */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-4">Typography Demo</h3>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-foreground">Heading 1</h1>
              <h2 className="text-2xl font-semibold text-foreground">Heading 2</h2>
              <h3 className="text-xl font-medium text-foreground">Heading 3</h3>
              <p className="text-base text-foreground">
                This is regular body text. It should scale with your font size preference.
              </p>
              <p className="text-sm text-muted-foreground">
                This is smaller secondary text that provides additional context.
              </p>
            </div>
          </div>

          {/* Layout Demo */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-4">Layout Demo</h3>
            <div className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg">
                <h4 className="font-medium text-foreground">Card Component</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Spacing adjusts based on your layout density preference.
                </p>
              </div>
              <div className="bg-secondary/10 p-4 rounded-lg">
                <h4 className="font-medium text-foreground">Another Card</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Notice how the padding and margins change.
                </p>
              </div>
            </div>
          </div>

          {/* Animation Demo */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-4">Animation Demo</h3>
            <div className="space-y-4">
              <button className="btn btn-primary animate-pulse">
                Pulsing Button
              </button>
              <div className="w-8 h-8 bg-primary rounded-full animate-spin mx-auto"></div>
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 rounded-lg animate-fade-in">
                <p className="text-sm text-foreground">
                  Animations respect your motion preferences.
                </p>
              </div>
            </div>
          </div>

          {/* Color Demo */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-4">Color Demo</h3>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full"></div>
                <div className="w-8 h-8 bg-secondary rounded-full"></div>
                <div className="w-8 h-8 bg-accent rounded-full"></div>
              </div>
              <div className="space-y-2">
                <p className="text-primary">Primary text color</p>
                <p className="text-foreground">Regular text color</p>
                <p className="text-muted-foreground">Muted text color</p>
              </div>
              <div className="flex space-x-2">
                <span className="badge-primary">Primary Badge</span>
                <span className="badge-secondary">Secondary Badge</span>
                <span className="badge-success">Success Badge</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Elements Demo */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-4">Interactive Elements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn btn-primary">Primary Button</button>
            <button className="btn btn-secondary">Secondary Button</button>
            <button className="btn btn-outline">Outline Button</button>
            <button className="btn btn-ghost">Ghost Button</button>
          </div>
          
          <div className="mt-6 space-y-4">
            <input 
              type="text" 
              placeholder="Sample input field" 
              className="input w-full max-w-md"
            />
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-foreground">Checkbox option</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="demo" className="rounded-full" />
                <span className="text-sm text-foreground">Radio option</span>
              </label>
            </div>
          </div>
        </div>

        {/* Accessibility Notice */}
        <div className="bg-info/10 border border-info/20 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-info rounded-full flex-shrink-0 mt-0.5"></div>
            <div>
              <h4 className="font-medium text-foreground">Accessibility Features</h4>
              <p className="text-sm text-muted-foreground mt-1">
                High contrast and reduced motion settings help make the app more accessible. 
                These preferences are automatically detected from your system settings when possible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}