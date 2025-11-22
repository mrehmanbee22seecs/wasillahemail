# CMS Implementation Guide

## Overview

The Professional CMS (Content Management System) provides a complete solution for creating, editing, and managing content with rich text editing, media management, version control, and SEO optimization.

## Features

### 1. Rich Text Editor (TipTap-based)
- **WYSIWYG Editing**: Full visual editing experience with 20+ formatting options
- **Formatting Options**:
  - Text styles: Bold, Italic, Underline, Strikethrough
  - Headings: H1-H6 support
  - Lists: Ordered and unordered lists
  - Blockquotes and code blocks
  - Tables with resizable columns
  - Images and links
  - Text alignment and colors
  - Highlighting
- **Auto-save**: Automatic content saving every 30 seconds
- **Character Count**: Real-time character and word count tracking
- **Dark Mode**: Full support for dark theme
- **Placeholder**: Customizable placeholder text

### 2. Content Editor
- **Full Content Management**:
  - Title and slug auto-generation
  - Excerpt/description field
  - Content type selection (page, blog, project, event, email, custom)
  - Status management (draft, published, scheduled, archived)
- **Metadata Sidebar**:
  - Tags management (add, remove, display)
  - Categories organization
  - Document settings (type, status)
- **SEO Settings**:
  - Meta title and description
  - Keywords management
  - Canonical URL configuration
- **Scheduling**:
  - Schedule content for future publishing
  - Date/time picker for scheduling
- **Media Integration**:
  - Insert media directly from Media Library
  - Media browser modal
- **Auto-save**: Background auto-save with last saved indicator

### 3. Media Library
- **Upload System**:
  - Drag-and-drop file upload
  - Multi-file upload support
  - File size validation (configurable max size)
  - Progress indicator during upload
  - Cloudinary integration for storage
- **View Modes**:
  - Grid view: Visual thumbnail grid
  - List view: Detailed file information
- **Search & Filter**:
  - Real-time search by filename and tags
  - Type filtering (all, image, video, document)
  - Sort options (newest, oldest, name, size)
- **Media Management**:
  - Copy URL to clipboard
  - Download media files
  - Delete media (with confirmation)
  - Bulk operations (multi-select and bulk delete)
  - Edit metadata (tags, folders)
- **Selection Mode**:
  - Single and multi-select support
  - Insert into content editor
- **Cloudinary Features**:
  - Automatic image optimization
  - Responsive image delivery
  - Secure URLs
  - Folder organization

### 4. Version Control
- **Unlimited Version History**:
  - Automatic version creation on save
  - Manual version saves with custom messages
  - Version numbering system
- **Version Management**:
  - View all versions with timestamps
  - Restore any previous version
  - Compare versions (diff view)
  - Character and word count tracking per version
- **Undo/Redo System**:
  - Undo last 10 changes
  - Redo undone changes
  - Visual indicators for undo/redo availability
- **Auto-versioning**:
  - Creates versions on significant changes
  - Prevents version spam with intelligent detection
- **Version Metadata**:
  - Author information
  - Timestamp
  - Change message
  - Content statistics

## File Structure

```
src/
├── components/
│   └── CMS/
│       ├── RichTextEditor.tsx      # TipTap-based WYSIWYG editor
│       ├── ContentEditor.tsx       # Full content management UI
│       └── MediaLibrary.tsx        # Media browser and uploader
├── hooks/
│   └── useContentVersioning.ts    # Version control logic
├── services/
│   ├── contentService.ts          # Content CRUD operations
│   └── mediaService.ts            # Cloudinary integration
└── types/
    └── cms.ts                      # TypeScript definitions
```

## Database Schema

### Collections

#### `content`
```typescript
{
  id: string;
  type: 'page' | 'blog' | 'project' | 'event' | 'email' | 'custom';
  title: string;
  slug: string;
  excerpt?: string;
  content: string;            // HTML content
  contentJSON?: any;          // TipTap JSON format
  authorId: string;
  authorName: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived' | 'deleted';
  tags: string[];
  categories: string[];
  metadata: {
    views: number;
    likes: number;
    shares: number;
    editCount: number;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  publishedAt?: Date;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `content_versions`
```typescript
{
  id: string;
  contentId: string;
  versionNumber: number;
  content: string;
  contentJSON?: any;
  title: string;
  excerpt?: string;
  authorId: string;
  authorName: string;
  changeMessage?: string;
  createdAt: Date;
  characterCount: number;
  wordCount: number;
}
```

#### `media`
```typescript
{
  id: string;
  fileName: string;
  url: string;
  publicId: string;           // Cloudinary public ID
  type: 'image' | 'video' | 'document';
  format: string;             // jpg, png, mp4, etc.
  size: number;               // bytes
  width?: number;
  height?: number;
  uploaderId: string;
  uploaderName: string;
  uploadedAt: Date;
  tags: string[];
  folder: string;
  usageCount: number;
  usedIn: string[];           // Content IDs using this media
}
```

## Usage Examples

### 1. Using the Content Editor

```tsx
import { ContentEditor } from './components/CMS/ContentEditor';

function MyComponent() {
  const handleSave = (content: Content) => {
    console.log('Content saved:', content);
  };

  const handlePublish = (content: Content) => {
    console.log('Content published:', content);
  };

  return (
    <ContentEditor
      onSave={handleSave}
      onPublish={handlePublish}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

### 2. Using the Rich Text Editor Standalone

```tsx
import { RichTextEditor } from './components/CMS/RichTextEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  const handleChange = (html: string, json: any) => {
    setContent(html);
  };

  return (
    <RichTextEditor
      content={content}
      onChange={handleChange}
      placeholder="Start writing..."
      autoSave={true}
      onAutoSave={(content) => console.log('Auto-saved:', content)}
    />
  );
}
```

### 3. Using the Media Library

```tsx
import { MediaLibrary } from './components/CMS/MediaLibrary';

function MyComponent() {
  const handleSelectMedia = (media: Media) => {
    console.log('Media selected:', media.url);
  };

  return (
    <MediaLibrary
      onSelectMedia={handleSelectMedia}
      selectionMode={true}
      accept="image/*"
      maxSize={10 * 1024 * 1024} // 10MB
    />
  );
}
```

### 4. Using Version Control Hook

```tsx
import { useContentVersioning } from './hooks/useContentVersioning';

function MyComponent({ contentId }: { contentId: string }) {
  const {
    versions,
    currentVersion,
    saveVersion,
    restoreVersion,
    undoLastChange,
    canUndo,
  } = useContentVersioning(contentId);

  const handleSave = async () => {
    await saveVersion({
      content: '<p>Updated content</p>',
      metadata: { title: 'My Title' },
      changeMessage: 'Updated content',
    });
  };

  return (
    <div>
      <button onClick={handleSave}>Save Version</button>
      <button onClick={undoLastChange} disabled={!canUndo}>
        Undo
      </button>
      <div>
        {versions.map((version) => (
          <div key={version.id}>
            Version {version.versionNumber} - {version.createdAt.toLocaleString()}
            <button onClick={() => restoreVersion(version.id)}>Restore</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

### Cloudinary Setup

1. **Sign up for Cloudinary**: https://cloudinary.com (free tier: 10GB storage, 25k transformations/month)

2. **Get your credentials**:
   - Go to Dashboard → Account Details
   - Copy Cloud Name, API Key, and API Secret

3. **Create upload preset**:
   - Go to Settings → Upload
   - Create unsigned upload preset
   - Set folder structure and transformations

4. **Configure in app**:
   - Add credentials to `.env` file
   - Update `mediaService.ts` with your preset name

### Firestore Security Rules

The CMS collections are protected with these security rules:

- **Content**: Public read for published content, authenticated users can create/edit their own
- **Content Versions**: Only authors and admins can access
- **Media**: Public read (Cloudinary URLs), authenticated upload, owner/admin can delete
- **Content Templates**: Authenticated read, creator/admin can edit

### Firestore Indexes

Required composite indexes are defined in `firestore.indexes.json`:
- Content by status and date
- Content by author and date
- Content by type, status, and date
- Versions by content ID and date
- Media by uploader and date
- Media by type and date
- Media by folder and date

## Dependencies

The CMS uses these packages (already included):

```json
{
  "@tiptap/react": "^3.10.8",
  "@tiptap/starter-kit": "^3.10.8",
  "@tiptap/extension-image": "^3.10.8",
  "@tiptap/extension-link": "^3.10.8",
  "@tiptap/extension-table": "^3.10.8",
  "@tiptap/extension-color": "^3.10.8",
  "@tiptap/extension-highlight": "^3.10.8",
  "@tiptap/extension-placeholder": "^3.10.8",
  "@tiptap/extension-character-count": "^3.10.8",
  "cloudinary": "^2.8.0",
  "lucide-react": "^0.344.0"
}
```

## Cost Breakdown

### Cloudinary (Free Tier)
- **Storage**: 10GB
- **Bandwidth**: 10GB/month
- **Transformations**: 25,000/month
- **Cost**: $0/month (stays within free tier for typical usage)

### Firestore
- **Documents**: ~$0.02/month (minimal CMS metadata)
- **Queries**: ~$0.03/month (version history queries)
- **Storage**: ~$0.01/month (text content only, media on Cloudinary)
- **Cost**: ~$0.05/month

**Total Estimated Cost**: ~$0.05/month

## Best Practices

### Content Management
1. **Use slug auto-generation** for SEO-friendly URLs
2. **Fill SEO metadata** for better search engine visibility
3. **Use tags and categories** for content organization
4. **Write descriptive excerpts** for previews and social sharing
5. **Schedule content** for planned publishing campaigns

### Media Management
1. **Use folders** to organize media by type or project
2. **Add tags** to media for easy searching
3. **Optimize images** before upload when possible
4. **Use descriptive filenames** for better organization
5. **Delete unused media** to save storage space

### Version Control
1. **Write meaningful change messages** for version history
2. **Save versions before major changes** for safety
3. **Review diffs** before restoring old versions
4. **Use undo/redo** for quick changes
5. **Keep version history clean** by avoiding too frequent saves

### Performance
1. **Use lazy loading** for media grid
2. **Implement pagination** for large media libraries
3. **Cache frequently accessed content**
4. **Optimize images** with Cloudinary transformations
5. **Limit version history** to last 50 versions per content

## Security Considerations

1. **Authentication Required**: All CMS operations require authentication
2. **Role-Based Access**: Content authors can only edit their own content
3. **Admin Overrides**: Admins have full access to all content
4. **Media Validation**: File type and size validation on upload
5. **XSS Protection**: Content is sanitized before rendering
6. **CSRF Protection**: Firebase Auth handles CSRF tokens
7. **Secure Media URLs**: Cloudinary provides secure HTTPS URLs

## Troubleshooting

### Common Issues

**Issue**: Media upload fails
- Check Cloudinary credentials in `.env`
- Verify upload preset is unsigned and active
- Check file size limits
- Check network connectivity

**Issue**: Auto-save not working
- Verify contentId is provided to ContentEditor
- Check Firestore permissions
- Check browser console for errors
- Verify authentication status

**Issue**: Version history not loading
- Check Firestore indexes are deployed
- Verify contentId exists
- Check Firestore permissions
- Check browser console for errors

**Issue**: Rich text editor not showing
- Verify TipTap dependencies are installed
- Check for JavaScript errors in console
- Verify proper imports
- Check CSS is loaded

## Future Enhancements

Potential improvements for future versions:

1. **Collaborative Editing**: Real-time multi-user editing
2. **Content Workflow**: Approval workflows for publishing
3. **Content Analytics**: Track views, engagement, and performance
4. **AI Assistance**: Content suggestions and improvements
5. **Import/Export**: Bulk content import/export functionality
6. **Custom Fields**: User-defined content fields
7. **Content Templates**: Reusable content templates
8. **Revision Comments**: Add comments to version changes
9. **Content Locking**: Prevent concurrent edits
10. **Media Transformations**: In-app image editing

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments in source files
3. Check Firebase and Cloudinary documentation
4. Open an issue in the repository

---

**Version**: 1.0.0  
**Last Updated**: November 20, 2024  
**Status**: Production Ready ✅
