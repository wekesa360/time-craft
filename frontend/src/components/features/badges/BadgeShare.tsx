import React, { useState } from 'react';
import type { Badge } from '../../../types';
import { 
  X, 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Instagram,
  Copy,
  Download,
  Check
} from 'lucide-react';

interface BadgeShareProps {
  badge: Badge | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: (badge: Badge, platform: string, message?: string) => void;
}

const socialPlatforms = [
  {
    key: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-blue-500 hover:bg-blue-600 text-white',
    maxLength: 280
  },
  {
    key: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    maxLength: 500
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700 hover:bg-blue-800 text-white',
    maxLength: 300
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white',
    maxLength: 200
  }
];

export const BadgeShare: React.FC<BadgeShareProps> = ({
  badge,
  isOpen,
  onClose,
  onShare
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  const [copied, setCopied] = useState(false);

  const generateDefaultMessage = (platform: string) => {
    if (!badge) return '';

    const messages = {
      twitter: `🎉 Just unlocked the "${badge.name}" badge! ${badge.description} #productivity #achievement`,
      facebook: `Excited to share that I just unlocked the "${badge.name}" badge! ${badge.description} 🎯`,
      linkedin: `Proud to announce that I've unlocked the "${badge.name}" badge! ${badge.description} This milestone represents my commitment to continuous improvement and productivity.`,
      instagram: `New achievement unlocked! 🏆 "${badge.name}" - ${badge.description} #productivity #goals`
    };

    return messages[platform as keyof typeof messages] || messages.twitter;
  };

  const getCurrentMessage = () => {
    return customMessage || generateDefaultMessage(selectedPlatform);
  };

  const handleShare = (platform: string) => {
    if (!badge) return;
    
    const message = getCurrentMessage();
    onShare(badge, platform, message);
  };

  const copyToClipboard = async () => {
    if (!badge) return;
    
    const message = getCurrentMessage();
    const shareText = `${message}\n\nShared from TimeCraft - Your productivity companion`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadBadgeImage = () => {
    // This would generate and download a badge image
    // For now, we'll just show a placeholder
    console.log('Download badge image for:', badge?.name);
  };

  if (!isOpen || !badge) return null;

  const selectedPlatformData = socialPlatforms.find(p => p.key === selectedPlatform);
  const currentMessage = getCurrentMessage();
  const messageLength = currentMessage.length;
  const maxLength = selectedPlatformData?.maxLength || 280;
  const isMessageTooLong = messageLength > maxLength;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Share2 className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-foreground">Share Badge</h2>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Badge Preview */}
          <div className="card p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950/20 dark:to-accent-950/20 border-primary-200 dark:border-primary-800">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{badge.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{badge.name}</h3>
                <p className="text-foreground-secondary">{badge.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="badge-primary text-xs capitalize">{badge.tier}</span>
                  <span className="badge-secondary text-xs">{badge.points} points</span>
                  <span className="badge-success text-xs capitalize">{badge.category}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Choose Platform
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.key}
                    onClick={() => setSelectedPlatform(platform.key)}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-center
                      ${selectedPlatform === platform.key
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                        : 'border-border hover:border-primary-300 hover:bg-background-secondary'
                      }
                    `}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-foreground" />
                    <span className="text-sm font-medium text-foreground">{platform.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Customization */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Customize Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={generateDefaultMessage(selectedPlatform)}
              className={`input w-full h-24 resize-none ${
                isMessageTooLong ? 'border-red-500' : ''
              }`}
            />
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className={`${
                isMessageTooLong ? 'text-red-600' : 'text-foreground-secondary'
              }`}>
                {messageLength}/{maxLength} characters
              </span>
              {isMessageTooLong && (
                <span className="text-red-600">Message too long for {selectedPlatformData?.name}</span>
              )}
            </div>
          </div>

          {/* Message Preview */}
          <div className="card p-4 bg-background-secondary">
            <h4 className="font-medium text-foreground mb-2">Preview</h4>
            <p className="text-sm text-foreground-secondary whitespace-pre-wrap">
              {getCurrentMessage()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Social Platform Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.key}
                    onClick={() => handleShare(platform.key)}
                    disabled={isMessageTooLong}
                    className={`
                      ${platform.color} 
                      px-4 py-2 rounded-lg font-medium transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center space-x-2
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>Share on {platform.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Utility Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={copyToClipboard}
                className="btn-outline flex-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Text
                  </>
                )}
              </button>
              
              <button
                onClick={downloadBadgeImage}
                className="btn-outline flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="card p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Sharing Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Add relevant hashtags to increase visibility</li>
              <li>• Tag friends who might be interested in productivity</li>
              <li>• Share your journey and inspire others</li>
              <li>• Consider sharing your progress regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};