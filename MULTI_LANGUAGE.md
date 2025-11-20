# Multi-Language Support Documentation

Complete bilingual system for Wasilah platform supporting English (LTR) and Urdu (RTL).

## Overview

The i18n system provides:
- ✅ Full English and Urdu translations
- ✅ RTL (Right-to-Left) layout support
- ✅ Language switcher in header
- ✅ Admin translation management
- ✅ Persistent language preference
- ✅ Beautiful Urdu typography

## Architecture

### Core Files

1. **`src/i18n/config.ts`** - Configuration and hooks
2. **`src/contexts/LanguageContext.tsx`** - Global state management
3. **`src/i18n/locales/en.json`** - English translations (500+ keys)
4. **`src/i18n/locales/ur.json`** - Urdu translations (500+ keys)
5. **`src/components/LanguageSwitcher.tsx`** - UI toggle
6. **`src/components/Admin/TranslationEditor.tsx`** - Admin management

### Integration

```typescript
// App.tsx - Provider wrapping
<LanguageProvider>
  <App />
</LanguageProvider>
```

## Usage

### Basic Translation

```typescript
import { useTranslation } from '../i18n/config';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('buttons.submit')}</button>
    </div>
  );
};
```

### With Fallback

```typescript
const Title = () => {
  const { t } = useTranslation();
  return <h1>{t('pages.about.title', 'About Us')}</h1>;
};
```

### RTL-Aware Layout

```typescript
const Card = () => {
  const { dir, isRTL } = useTranslation();
  
  return (
    <div dir={dir} className={isRTL ? 'text-right' : 'text-left'}>
      {/* Content automatically flips for RTL */}
    </div>
  );
};
```

### Change Language

```typescript
const LanguageToggle = () => {
  const { language, changeLanguage } = useTranslation();
  
  return (
    <button onClick={() => changeLanguage(language === 'en' ? 'ur' : 'en')}>
      Switch to {language === 'en' ? 'Urdu' : 'English'}
    </button>
  );
};
```

## Translation Structure

### Categories

```json
{
  "common": "Common UI elements",
  "navigation": "Menu items",
  "auth": "Login/signup",
  "forms": "Form labels",
  "buttons": "Button text",
  "messages": "Notifications",
  "pages": "Page content",
  "dashboard": "Dashboard sections",
  "projects": "Project text",
  "events": "Event text",
  "volunteer": "Volunteer content",
  "donation": "Donation system",
  "subscription": "Plans",
  "analytics": "Analytics",
  "admin": "Admin panel",
  "pwa": "PWA prompts",
  "email": "Email system"
}
```

### Key Format

Use dot notation for nested keys:

```typescript
t('common.welcome')              // "Welcome" / "خوش آمدید"
t('pages.home.title')            // "Home" / "ہوم"
t('forms.email')                 // "Email" / "ای میل"
t('messages.loginSuccess')       // "Login successful" / "لاگ ان کامیاب رہا"
```

## RTL Support

### Automatic Layout Flip

The system automatically handles RTL layouts:

```css
/* CSS automatically applied */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .flex {
  flex-direction: row-reverse;
}
```

### Tailwind RTL Utilities

```html
<!-- Spacing (auto-flips) -->
<div class="ltr:ml-4 rtl:mr-4">Content</div>

<!-- Float (auto-flips) -->
<span class="ltr:float-left rtl:float-right">Text</span>

<!-- Text alignment -->
<p class="ltr:text-left rtl:text-right">Paragraph</p>
```

### Icons & Arrows

Icons automatically flip for RTL:

```typescript
<ChevronRight className={isRTL ? 'transform scale-x-[-1]' : ''} />
```

## Admin Translation Management

### Access

Navigate to `/admin/translations` (admin only).

### Features

1. **View All Translations**
   - Grid view of all keys
   - Search by key/text
   - Filter by category

2. **Edit Translations**
   - Side-by-side English/Urdu editing
   - Real-time validation
   - Missing translation detection

3. **Add New Keys**
   - Key format validation
   - Automatic categorization
   - Bulk operations

4. **Export/Import**
   - CSV format
   - Excel compatible
   - Merge with existing

### Workflow

1. **Edit Translation**:
   ```
   Click key → Edit English/Urdu → Auto-save
   ```

2. **Add New**:
   ```
   Fill form → Set key (e.g., "common.newKey") → Save
   ```

3. **Export**:
   ```
   Click "Export CSV" → Send to translator → Import back
   ```

## Fonts

### English
- Primary: Inter (sans-serif)
- Headings: Poppins (sans-serif)
- Display: Playfair Display (serif)

### Urdu
- Primary: Noto Nastaliq Urdu (serif)
- Beautiful calligraphic style
- Optimized for web rendering

## Best Practices

### 1. Always Use Translation Keys

❌ Bad:
```typescript
<button>Submit</button>
```

✅ Good:
```typescript
<button>{t('buttons.submit')}</button>
```

### 2. Provide Fallbacks for New Keys

```typescript
t('newKey', 'Default Text')
```

### 3. Use Semantic Keys

❌ Bad: `t('button1')`
✅ Good: `t('buttons.submitApplication')`

### 4. Handle Dynamic Content

```typescript
// For user names, numbers, etc.
const message = `${t('messages.welcome')} ${userName}!`;
```

### 5. RTL-Aware Layouts

```typescript
// Always check for RTL
const { isRTL } = useTranslation();

<div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
  <span>{t('label')}</span>
</div>
```

## Testing

### Test Language Switch

1. Click language switcher in header
2. Verify all text changes
3. Check layout flips for RTL
4. Confirm persistence (refresh page)

### Test RTL Layout

1. Switch to Urdu
2. Check navigation alignment
3. Verify form labels (right-aligned)
4. Test modal positioning
5. Verify icon directions

### Test Missing Translations

1. Add new component with keys
2. Switch to Urdu
3. Should fallback to English
4. Add Urdu translation via admin panel

## Performance

### Translation Loading

- Translations loaded once on app start
- Cached in memory (no API calls)
- ~100KB per language (gzipped: ~20KB)
- Language switch: <50ms

### Optimization Tips

1. **Lazy Loading** (future):
   ```typescript
   const translations = lazy(() => import(`./locales/${lang}.json`));
   ```

2. **Code Splitting** (future):
   ```typescript
   // Load translations per route
   ```

3. **Memoization**:
   ```typescript
   const memoizedT = useMemo(() => t('key'), [language]);
   ```

## Troubleshooting

### Translation Not Showing

1. Check key exists in en.json
2. Verify import in component
3. Check translation file syntax (valid JSON)
4. Clear cache and rebuild

### RTL Layout Broken

1. Verify `dir` attribute on HTML element
2. Check Tailwind RTL utilities
3. Ensure parent containers support RTL
4. Test on different browsers

### Language Not Persisting

1. Check localStorage support
2. Verify LanguageContext provider
3. Check browser console for errors

### Urdu Font Not Loading

1. Check internet connection
2. Verify Google Fonts link in index.html
3. Check font-family in Tailwind config
4. Clear browser cache

## Future Enhancements

### More Languages
- [ ] Punjabi (pa)
- [ ] Sindhi (sd)
- [ ] Pashto (ps)

### Advanced Features
- [ ] Pluralization rules
- [ ] Date/time localization
- [ ] Number formatting (lakhs/crores)
- [ ] Currency formatting

### Tools
- [ ] Translation memory
- [ ] Machine translation integration
- [ ] Collaboration workflow
- [ ] Version control

## Cost Analysis

**Firestore**: ~$0.01/month (translation document)
**Performance**: Zero runtime cost (pre-loaded)
**Fonts**: Free (Google Fonts)
**Total**: ~$0.01/month

## Support

For issues or questions:
1. Check this documentation
2. Review translation files
3. Test in admin panel
4. Check browser console

## Examples

### Complete Component

```typescript
import React from 'react';
import { useTranslation } from '../i18n/config';

export const WelcomeCard: React.FC = () => {
  const { t, dir, isRTL } = useTranslation();
  
  return (
    <div dir={dir} className="bg-white rounded-lg p-6">
      <h2 className={`text-2xl font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
        {t('pages.home.title')}
      </h2>
      <p className="text-gray-600 mt-2">
        {t('pages.home.subtitle')}
      </p>
      <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded">
        {t('buttons.learnMore')}
      </button>
    </div>
  );
};
```

---

**All 500+ keys translated and ready to use!** 🌍
