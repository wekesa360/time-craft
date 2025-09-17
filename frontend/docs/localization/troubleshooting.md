# German Localization Troubleshooting Guide

This guide helps you resolve common issues with German localization features in TimeCraft.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Language Switching Problems](#language-switching-problems)
3. [Translation Issues](#translation-issues)
4. [Performance Problems](#performance-problems)
5. [Accessibility Issues](#accessibility-issues)
6. [Cache-Related Problems](#cache-related-problems)
7. [Browser-Specific Issues](#browser-specific-issues)
8. [Advanced Troubleshooting](#advanced-troubleshooting)

## Common Issues

### Issue: Interface Not Switching to German

**Symptoms:**
- Language selector shows German is selected
- Interface remains in English
- Some parts are German, others English

**Solutions:**

1. **Clear Browser Cache**
   ```
   1. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   2. Select "Cached images and files"
   3. Clear cache and reload the page
   ```

2. **Reset Language Preference**
   ```
   1. Go to Settings → Language
   2. Select English, save, then select German again
   3. Wait for the interface to fully reload
   ```

3. **Check Translation Cache**
   ```
   1. Go to Settings → Cache Management
   2. Click "Clear Translation Cache"
   3. Refresh the page and switch to German again
   ```

### Issue: Partial German Translation

**Symptoms:**
- Most interface is in German
- Some buttons or labels remain in English
- New features appear in English

**Solutions:**

1. **Update Translation Cache**
   ```
   1. Settings → Cache Management
   2. Click "Refresh Stats" and "Preload Languages"
   3. Wait for cache to update
   ```

2. **Check Translation Coverage**
   ```
   1. Go to Localization page
   2. Check German translation coverage percentage
   3. If below 100%, some English fallbacks are expected
   ```

3. **Report Missing Translations**
   ```
   1. Note which specific text remains in English
   2. Use the feedback system to report missing translations
   3. Include screenshots if possible
   ```

## Language Switching Problems

### Issue: Language Switch Takes Too Long

**Symptoms:**
- Long delay when switching languages
- Loading spinner appears for extended time
- Interface becomes unresponsive during switch

**Solutions:**

1. **Enable Translation Preloading**
   ```
   1. Settings → Cache Management
   2. Click "Preload Languages"
   3. Enable auto-refresh for cache
   ```

2. **Check Network Connection**
   ```
   1. Ensure stable internet connection
   2. Try switching on different network
   3. Check browser's network tab for failed requests
   ```

3. **Clear and Rebuild Cache**
   ```
   1. Settings → Cache Management → Advanced Settings
   2. Click "Clear All Cache"
   3. Refresh page and allow cache to rebuild
   ```

### Issue: Language Reverts to English

**Symptoms:**
- German selected but switches back to English
- Language preference not saved
- Happens after page refresh

**Solutions:**

1. **Check Local Storage**
   ```
   1. Open browser Developer Tools (F12)
   2. Go to Application → Local Storage
   3. Look for language preference entries
   4. Clear if corrupted
   ```

2. **Verify Account Settings**
   ```
   1. Go to Settings → Account
   2. Ensure language preference is saved to profile
   3. Try logging out and back in
   ```

3. **Disable Browser Language Override**
   ```
   1. Check if browser is forcing language
   2. Settings → Advanced → Languages
   3. Ensure German is in preferred languages list
   ```

## Translation Issues

### Issue: Incorrect German Translations

**Symptoms:**
- German text doesn't make sense
- Grammar errors in German interface
- Formal/informal address inconsistency

**Solutions:**

1. **Report Translation Issues**
   ```
   1. Take screenshot of incorrect translation
   2. Note the context where it appears
   3. Use feedback system to report issue
   4. Include suggested correction if possible
   ```

2. **Check for Updates**
   ```
   1. Refresh translation cache
   2. Check if app update is available
   3. Clear cache and reload if needed
   ```

### Issue: Mixed Languages in Interface

**Symptoms:**
- Some parts German, others English
- Inconsistent language across different sections
- New content appears in wrong language

**Solutions:**

1. **Force Complete Language Reload**
   ```
   1. Switch to English and wait for full load
   2. Clear translation cache
   3. Switch back to German
   4. Wait for complete reload
   ```

2. **Check Component-Specific Issues**
   ```
   1. Note which specific components show wrong language
   2. Try navigating away and back to those sections
   3. Report if specific components consistently fail
   ```

## Performance Problems

### Issue: Slow German Text Rendering

**Symptoms:**
- German text appears slowly
- Lag when typing in German
- Interface feels sluggish with German content

**Solutions:**

1. **Optimize Font Loading**
   ```
   1. Check if German fonts are loading properly
   2. Clear browser font cache
   3. Disable font extensions if any
   ```

2. **Reduce Translation Cache Size**
   ```
   1. Settings → Cache Management
   2. Check cache size and clear if too large
   3. Disable compression if causing issues
   ```

3. **Check Memory Usage**
   ```
   1. Settings → Cache Management → Performance Metrics
   2. Monitor memory usage
   3. Clear cache if memory usage is high
   ```

### Issue: High Memory Usage with German

**Symptoms:**
- Browser becomes slow with German interface
- High memory usage in task manager
- Browser crashes or freezes

**Solutions:**

1. **Optimize Cache Settings**
   ```
   1. Settings → Cache Management → Advanced
   2. Reduce cache size limit
   3. Enable compression
   4. Set shorter cache expiry time
   ```

2. **Disable Preloading**
   ```
   1. Turn off automatic preloading
   2. Load translations on-demand only
   3. Clear existing cache
   ```

## Accessibility Issues

### Issue: Screen Reader Not Reading German

**Symptoms:**
- Screen reader pronounces German text incorrectly
- German content not announced properly
- Language changes not announced

**Solutions:**

1. **Check Screen Reader Language Settings**
   ```
   1. Ensure screen reader supports German
   2. Set German as secondary language
   3. Enable automatic language switching
   ```

2. **Verify HTML Language Attributes**
   ```
   1. Open Developer Tools
   2. Check if HTML lang attribute is set to "de"
   3. Refresh page if not set correctly
   ```

3. **Update Screen Reader Software**
   ```
   1. Ensure latest version of screen reader
   2. Check for German language pack updates
   3. Restart screen reader after updates
   ```

### Issue: Keyboard Navigation Problems

**Symptoms:**
- Tab order incorrect with German interface
- Keyboard shortcuts not working
- German characters not input correctly

**Solutions:**

1. **Check Keyboard Layout**
   ```
   1. Ensure German keyboard layout is available
   2. Switch to German keyboard if needed
   3. Test umlauts (ä, ö, ü) and ß character input
   ```

2. **Reset Tab Order**
   ```
   1. Refresh the page
   2. Clear browser cache
   3. Check if specific components have tab issues
   ```

## Cache-Related Problems

### Issue: Outdated German Translations

**Symptoms:**
- Old German text appears
- New features not translated
- Translation updates not appearing

**Solutions:**

1. **Force Cache Refresh**
   ```
   1. Settings → Cache Management
   2. Click "Clear Translation Cache"
   3. Click "Refresh Stats"
   4. Wait for cache to rebuild
   ```

2. **Check Cache Integrity**
   ```
   1. Settings → Cache Management
   2. View cache integrity report
   3. Clear corrupted entries if any
   ```

3. **Disable Cache Temporarily**
   ```
   1. Open Developer Tools (F12)
   2. Go to Network tab
   3. Check "Disable cache"
   4. Refresh page to load fresh translations
   ```

### Issue: Cache Taking Too Much Space

**Symptoms:**
- Browser storage warnings
- Slow performance
- Cache size very large

**Solutions:**

1. **Optimize Cache Settings**
   ```
   1. Settings → Cache Management → Advanced
   2. Reduce maximum cache size
   3. Enable compression
   4. Set shorter expiry times
   ```

2. **Selective Cache Clearing**
   ```
   1. Clear only expired entries
   2. Keep frequently used translations
   3. Remove unused language caches
   ```

## Browser-Specific Issues

### Chrome Issues

**Common Problems:**
- Translation cache not persisting
- Service worker not registering

**Solutions:**
```
1. Check chrome://settings/content/all
2. Ensure site has storage permissions
3. Clear site data and reload
4. Disable extensions that might interfere
```

### Firefox Issues

**Common Problems:**
- Font rendering issues with German characters
- Local storage limitations

**Solutions:**
```
1. Check about:config for font settings
2. Increase dom.storage.default_quota
3. Clear Firefox cache and cookies
4. Disable strict tracking protection for site
```

### Safari Issues

**Common Problems:**
- Service worker limitations
- Cache size restrictions

**Solutions:**
```
1. Enable Develop menu and check Web Inspector
2. Clear Safari cache and website data
3. Check Preferences → Privacy settings
4. Disable content blockers temporarily
```

### Edge Issues

**Common Problems:**
- Translation loading delays
- Cache synchronization issues

**Solutions:**
```
1. Reset Edge settings
2. Clear browsing data
3. Check site permissions
4. Disable tracking prevention for site
```

## Advanced Troubleshooting

### Developer Tools Debugging

1. **Check Console for Errors**
   ```javascript
   // Open Developer Tools (F12)
   // Look for errors related to:
   - i18n loading errors
   - Translation cache errors
   - Network request failures
   ```

2. **Monitor Network Requests**
   ```
   1. Network tab in Developer Tools
   2. Filter for translation-related requests
   3. Check for failed or slow requests
   4. Verify response content
   ```

3. **Inspect Local Storage**
   ```javascript
   // In Console, check cache contents:
   localStorage.getItem('translation_cache_de')
   
   // Clear specific cache entries:
   localStorage.removeItem('translation_cache_de')
   ```

### Performance Profiling

1. **Memory Usage Analysis**
   ```
   1. Developer Tools → Memory tab
   2. Take heap snapshot
   3. Look for translation-related objects
   4. Check for memory leaks
   ```

2. **Performance Timeline**
   ```
   1. Developer Tools → Performance tab
   2. Record during language switch
   3. Analyze rendering and script execution
   4. Identify bottlenecks
   ```

### Service Worker Issues

1. **Check Service Worker Status**
   ```
   1. Developer Tools → Application tab
   2. Service Workers section
   3. Check if translation cache worker is active
   4. Update or unregister if needed
   ```

2. **Clear Service Worker Cache**
   ```javascript
   // In Console:
   navigator.serviceWorker.getRegistrations().then(function(registrations) {
     for(let registration of registrations) {
       registration.unregister();
     }
   });
   ```

## Getting Additional Help

### When to Contact Support

Contact support if you experience:
- Persistent issues after trying all solutions
- Data loss or corruption
- Security-related concerns
- Issues affecting multiple users

### Information to Include

When reporting issues, include:
1. **Browser and version**
2. **Operating system**
3. **Steps to reproduce the issue**
4. **Screenshots or screen recordings**
5. **Console error messages**
6. **Cache statistics from settings**

### Emergency Workarounds

If German localization is completely broken:

1. **Switch to English Temporarily**
   ```
   1. Add ?lang=en to URL
   2. Use English interface to access settings
   3. Clear all caches and reset
   ```

2. **Reset All Localization Settings**
   ```
   1. Clear all browser data for the site
   2. Restart browser
   3. Log in and reconfigure language settings
   ```

3. **Use Incognito/Private Mode**
   ```
   1. Test in private browsing mode
   2. If works, issue is with stored data
   3. Clear storage and try again
   ```

---

*For additional support, contact our German-speaking support team or visit the community forum.*