# Social Sharing & Calendar Integrations

Complete client-side integration system for social sharing and calendar functionality with zero backend costs.

## Overview

This integration system provides:
- **Social Sharing**: WhatsApp, Facebook, Twitter, LinkedIn, Email
- **Calendar Integration**: Google Calendar, Outlook, Yahoo, ICS download
- **Native Web Share API**: For mobile devices
- **Copy to Clipboard**: Quick link sharing

**Cost**: $0/month (all client-side, no Firebase costs)

---

## Social Sharing

### Features

**Supported Platforms:**
- 📱 WhatsApp (web.whatsapp.com and wa.me)
- 📘 Facebook
- 🐦 Twitter with hashtags
- 💼 LinkedIn
- ✉️ Email (mailto:)
- 🔗 Copy link to clipboard
- 📤 Native Web Share API (mobile)

### Usage

**ShareButtons Component:**

```typescript
import { ShareButtons } from './components/ShareButtons';

const content = {
  title: 'Beach Cleanup Drive',
  description: 'Join us for a beach cleanup event in Karachi',
  url: 'https://wasilah.com/events/beach-cleanup',
  hashtags: ['volunteer', 'pakistan', 'karachi']
};

<ShareButtons 
  content={content}
  size="medium"
  showLabels={false}
/>
```

**Manual Sharing:**

```typescript
import { openShareLink, shareViaWebAPI, copyToClipboard } from './utils/socialSharing';

// Share to WhatsApp
openShareLink('whatsapp', content);

// Use native share (mobile)
const shared = await shareViaWebAPI(content);

// Copy link
const copied = await copyToClipboard(content.url);
```

### Platform-Specific Links

**WhatsApp:**
- Desktop: `https://web.whatsapp.com/send?text=...`
- Mobile: `whatsapp://send?text=...`

**Facebook:**
- `https://www.facebook.com/sharer/sharer.php?u=...`

**Twitter:**
- `https://twitter.com/intent/tweet?url=...&text=...&hashtags=...`

**LinkedIn:**
- `https://www.linkedin.com/sharing/share-offsite/?url=...`

**Email:**
- `mailto:?subject=...&body=...`

---

## Calendar Integration

### Features

**Supported Calendars:**
- 📅 Google Calendar (web link)
- 📆 Outlook Calendar (web link)
- 📋 Yahoo Calendar (web link)
- 💾 ICS File Download (universal)

### Usage

**AddToCalendar Component:**

```typescript
import { AddToCalendar } from './components/AddToCalendar';

const event = {
  title: 'Beach Cleanup Drive',
  description: 'Join us for a volunteer event',
  location: 'Clifton Beach, Karachi',
  startTime: new Date('2024-12-25T09:00:00'),
  endTime: new Date('2024-12-25T12:00:00'),
  timezone: 'Asia/Karachi'
};

// Dropdown variant (default)
<AddToCalendar event={event} variant="dropdown" />

// Single button (Google Calendar)
<AddToCalendar event={event} variant="button" />

// All options visible
<AddToCalendar event={event} variant="inline" />
```

**Manual Calendar Links:**

```typescript
import { openCalendarLink, downloadICSFile } from './utils/calendarLinks';

// Open Google Calendar
openCalendarLink('google', event);

// Download ICS file
downloadICSFile(event);
```

### Calendar Link Formats

**Google Calendar:**
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...&location=...
```

**Outlook Calendar:**
```
https://outlook.live.com/calendar/0/deeplink/compose?subject=...&body=...&location=...&startdt=...&enddt=...
```

**Yahoo Calendar:**
```
https://calendar.yahoo.com/?v=60&title=...&st=...&dur=...&desc=...&in_loc=...
```

**ICS File:**
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Wasilah//Event Calendar//EN
BEGIN:VEVENT
DTSTART:20241225T090000Z
DTEND:20241225T120000Z
SUMMARY:Beach Cleanup Drive
DESCRIPTION:Join us for a volunteer event
LOCATION:Clifton Beach, Karachi
END:VEVENT
END:VCALENDAR
```

---

## Component Examples

### Project Sharing

```typescript
// In ProjectDetails.tsx
import { ShareButtons } from './components/ShareButtons';

const projectContent = {
  title: project.title,
  description: project.shortDescription,
  url: `https://wasilah.com/projects/${project.id}`,
  image: project.image,
  hashtags: ['volunteer', 'pakistan', project.category.toLowerCase()]
};

<ShareButtons content={projectContent} size="medium" />
```

### Event Sharing with Calendar

```typescript
// In EventDetails.tsx
import { ShareButtons } from './components/ShareButtons';
import { AddToCalendar } from './components/AddToCalendar';

const eventContent = {
  title: event.title,
  description: event.description,
  url: `https://wasilah.com/events/${event.id}`,
  hashtags: ['event', 'pakistan', event.category.toLowerCase()]
};

const calendarEvent = {
  title: event.title,
  description: event.description,
  location: event.location,
  startTime: new Date(event.startDate),
  endTime: new Date(event.endDate),
  timezone: 'Asia/Karachi'
};

<div className="flex flex-col gap-4">
  <ShareButtons content={eventContent} />
  <AddToCalendar event={calendarEvent} variant="dropdown" />
</div>
```

### NGO Profile Sharing

```typescript
// In NGOProfile.tsx
import { ShareButtons } from './components/ShareButtons';

const ngoContent = {
  title: ngo.name,
  description: ngo.description,
  url: `https://wasilah.com/ngos/${ngo.id}`,
  image: ngo.logo
};

<ShareButtons content={ngoContent} size="large" showLabels={true} />
```

---

## Mobile Features

### Native Web Share API

Automatically detects and uses native share sheet on mobile:

```typescript
import { canUseWebShare, shareViaWebAPI } from './utils/socialSharing';

if (canUseWebShare()) {
  // Will show native share sheet with installed apps
  await shareViaWebAPI(content);
} else {
  // Fallback to share buttons
  <ShareButtons content={content} />
}
```

### Responsive Behavior

**WhatsApp Detection:**
- Desktop → Opens web.whatsapp.com
- Mobile → Opens WhatsApp app (whatsapp://)

**Share Buttons:**
- Desktop → Multiple platform buttons
- Mobile → Native share button + platform buttons

---

## Styling & Customization

### Size Options

```typescript
<ShareButtons size="small" />   // 32x32px buttons
<ShareButtons size="medium" />  // 40x40px buttons (default)
<ShareButtons size="large" />   // 48x48px buttons
```

### Variants

**Compact (icons only):**
```typescript
<ShareButtons content={content} showLabels={false} />
```

**With Labels:**
```typescript
<ShareButtons content={content} showLabels={true} />
```

**Calendar Dropdown:**
```typescript
<AddToCalendar event={event} variant="dropdown" />
```

**Calendar Inline:**
```typescript
<AddToCalendar event={event} variant="inline" />
```

---

## Analytics Tracking

Track sharing activity with Google Analytics:

```typescript
import { trackEvent } from './utils/googleAnalytics';

const handleShare = (platform: string) => {
  // Share logic...
  
  // Track in GA4
  trackEvent('share', {
    method: platform,
    content_type: 'project',
    content_id: project.id
  });
};
```

---

## Browser Compatibility

**Social Sharing:**
- ✅ All modern browsers
- ✅ Mobile browsers (iOS Safari, Chrome, Samsung Internet)
- ✅ No dependencies required

**Calendar Links:**
- ✅ All browsers with link support
- ✅ ICS download works everywhere

**Web Share API:**
- ✅ Chrome (Android, Desktop)
- ✅ Safari (iOS, macOS)
- ✅ Edge (Desktop, Mobile)
- ⚠️ Firefox (mobile only)

**Clipboard API:**
- ✅ All modern browsers (HTTPS required)
- ⚠️ HTTP fallback uses textarea copy

---

## Pakistan Optimization

**WhatsApp:**
- Most popular messaging app in Pakistan
- Works on 2G/3G networks
- Primary share method

**Calendar:**
- Google Calendar most popular
- Works with local timezone (Asia/Karachi)
- ICS download for offline sharing

**Performance:**
- All client-side (no server calls)
- Works offline (generates links locally)
- Low data usage (just link generation)

---

## Testing

**Test Share Links:**
```bash
# Open in browser to test
https://web.whatsapp.com/send?text=Test
https://www.facebook.com/sharer/sharer.php?u=https://wasilah.com
https://twitter.com/intent/tweet?url=https://wasilah.com&text=Test
```

**Test Calendar:**
```bash
# Generate and download ICS file
# Import into any calendar app to verify
```

**Test Clipboard:**
```typescript
const success = await copyToClipboard('https://wasilah.com');
console.log('Copied:', success);
```

---

## Troubleshooting

**WhatsApp not opening:**
- Check if WhatsApp is installed on mobile
- Verify URL encoding is correct
- Desktop users need web.whatsapp.com

**Calendar events not showing:**
- Verify dates are in correct format
- Check timezone settings
- Ensure end time is after start time

**Clipboard fails:**
- Must use HTTPS
- Check browser permissions
- Fallback to manual copy

**Web Share not working:**
- Only works on HTTPS
- Must be triggered by user action
- Not all browsers support it

---

## Future Enhancements

**Planned Features:**
- [ ] Instagram sharing (story links)
- [ ] Telegram sharing
- [ ] Pinterest sharing (for images)
- [ ] Share analytics dashboard
- [ ] QR code generation
- [ ] Short link generation
- [ ] Custom share images

**Advanced Calendar:**
- [ ] Apple Calendar deep links
- [ ] Recurring events support
- [ ] Calendar sync (read-only)
- [ ] Time zone conversion

---

## Cost Summary

**Total Monthly Cost: $0**

All integrations are client-side with zero backend costs:
- Social sharing: Free (URL generation)
- Calendar links: Free (URL generation)
- Web Share API: Free (browser native)
- Clipboard API: Free (browser native)
- No Firebase Functions needed
- No external API calls
- No rate limiting concerns

**Perfect for Pakistan market** with cost-free sharing and calendar integration!
