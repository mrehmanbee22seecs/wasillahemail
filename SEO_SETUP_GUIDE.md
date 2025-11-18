# SEO Setup Guide

This document explains how to complete the SEO setup for the Wasilah platform.

## ✅ Already Completed

1. **React Helmet Async Installation** - Installed via package.json
2. **HelmetProvider Wrapper** - Added to src/main.tsx
3. **GA4 Integration** - Implemented in src/utils/googleAnalytics.ts
4. **Auto Page View Tracking** - Configured in src/App.tsx
5. **SEO Components** - Created in src/components/SEO/SEOHead.tsx
6. **Sitemap** - Generated in public/sitemap.xml
7. **Robots.txt** - Created in public/robots.txt

## 🔧 Steps to Complete Setup

### 1. Set Up Google Analytics 4

1. Go to [Google Analytics](https://analytics.google.com)
2. Click "Admin" (bottom left gear icon)
3. Create a new property:
   - Property name: "Wasilah"
   - Time zone: "Pakistan Standard Time"
   - Currency: "Pakistani Rupee (PKR)"
4. Create a Data Stream:
   - Platform: Web
   - Website URL: https://wasilah.com (or your domain)
   - Stream name: "Wasilah Website"
5. Copy your **Measurement ID** (format: G-XXXXXXXXXX)
6. Add it to your `.env` file:
   ```bash
   VITE_GA4_MEASUREMENT_ID=G-YOUR-ACTUAL-ID
   ```

### 2. Verify Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add a new property with your domain
3. Verify ownership using one of these methods:
   - **Recommended**: Google Analytics (automatically verified if GA4 is set up)
   - Alternative: HTML file upload
   - Alternative: HTML meta tag
   - Alternative: DNS record

### 3. Submit Sitemap

1. In Google Search Console, go to "Sitemaps" (left sidebar)
2. Enter sitemap URL: `https://yourdomain.com/sitemap.xml`
3. Click "Submit"
4. Wait 1-2 days for Google to crawl your site

### 4. Test with Lighthouse

Run Lighthouse audit in Chrome DevTools:

```bash
# Open Chrome DevTools
# Go to: Lighthouse tab
# Click "Generate report"
# Check SEO score (target: >90)
```

**Or use CLI:**
```bash
npm install -g lighthouse
lighthouse https://yourdomain.com --view
```

### 5. Verify SEO Meta Tags

Use these free tools to verify your SEO implementation:

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **Schema.org Validator**: https://validator.schema.org/

## 📊 Expected Results

After setup completion, you should see:

✅ **Lighthouse SEO Score**: 90-100
✅ **Performance Score**: 85-95  
✅ **Accessibility Score**: 90-100
✅ **Best Practices**: 90-100
✅ **PWA**: Yes (installable)

## 🔍 Monitoring

### Weekly Checks
- [ ] Review Google Search Console for crawl errors
- [ ] Check Google Analytics for traffic patterns
- [ ] Monitor page speed in Lighthouse

### Monthly Checks
- [ ] Review top performing pages
- [ ] Analyze search queries
- [ ] Update meta descriptions if needed
- [ ] Check for broken links

## 🐛 Troubleshooting

**Issue: GA4 not tracking**
- Check browser console for errors
- Verify Measurement ID is correct
- Check ad blockers are disabled (for testing)
- Wait 24-48 hours for data to appear

**Issue: Pages not indexed**
- Submit sitemap to Search Console
- Request indexing manually
- Check robots.txt isn't blocking pages
- Verify canonical URLs are correct

**Issue: Low SEO score**
- Run Lighthouse audit for specific issues
- Fix any accessibility warnings
- Optimize images (use WebP format)
- Improve page load speed

## 📚 Additional Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Google Search Console Help](https://support.google.com/webmasters)
- [Lighthouse Scoring Guide](https://web.dev/performance-scoring/)
- [SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)

## 💡 Pro Tips

1. **Enable Google Analytics Enhanced Measurement** for automatic event tracking
2. **Set up Google Search Console email alerts** for critical issues
3. **Create custom GA4 events** for important user actions
4. **Use UTM parameters** for tracking marketing campaigns
5. **Monitor Core Web Vitals** in Search Console

## 🎯 Next Steps

After completing the basic setup:

1. Set up **Google Tag Manager** for advanced tracking
2. Implement **conversion tracking** for donations and volunteer signups
3. Create **custom dashboards** in Google Analytics
4. Set up **automated reports** via email
5. Implement **A/B testing** for key pages
