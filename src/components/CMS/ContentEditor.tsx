/**
 * Content Editor Component
 * Full-featured content management interface with metadata, SEO, and scheduling
 */

import React, { useState, useEffect } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { MediaLibrary } from './MediaLibrary';
import { useContentVersioning } from '../../hooks/useContentVersioning';
import type { Content, ContentStatus, ContentType } from '../../types/cms';
import {
  Save,
  Eye,
  Calendar,
  Tag,
  Hash,
  Globe,
  Image as ImageIcon,
  Clock,
  FileText,
  Settings,
  X,
} from 'lucide-react';

interface ContentEditorProps {
  contentId?: string;
  initialContent?: Partial<Content>;
  onSave?: (content: Content) => void;
  onCancel?: () => void;
  onPublish?: (content: Content) => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  contentId,
  initialContent,
  onSave,
  onCancel,
  onPublish,
}) => {
  const [content, setContent] = useState<Partial<Content>>(
    initialContent || {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      contentJSON: null,
      type: 'page' as ContentType,
      status: 'draft' as ContentStatus,
      tags: [],
      categories: [],
      metadata: {
        views: 0,
        likes: 0,
        shares: 0,
        editCount: 0,
      },
      seo: {
        metaTitle: '',
        metaDescription: '',
        keywords: [],
        canonicalUrl: '',
      },
    }
  );

  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  const {
    versions,
    currentVersion,
    isLoading: versionsLoading,
    saveVersion,
    restoreVersion,
  } = useContentVersioning(contentId);

  // Auto-generate slug from title
  useEffect(() => {
    if (content.title && !content.slug) {
      const slug = content.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setContent((prev) => ({ ...prev, slug }));
    }
  }, [content.title]);

  // Auto-save functionality
  useEffect(() => {
    if (!contentId) return;

    const autoSaveTimer = setInterval(() => {
      handleAutoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [content, contentId]);

  const handleAutoSave = async () => {
    if (!contentId || !content.content) return;

    try {
      await saveVersion({
        content: content.content,
        contentJSON: content.contentJSON,
        metadata: content.metadata || {},
        changeMessage: 'Auto-saved',
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleContentChange = (html: string, json: any) => {
    setContent((prev) => ({
      ...prev,
      content: html,
      contentJSON: json,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (contentId) {
        await saveVersion({
          content: content.content!,
          contentJSON: content.contentJSON,
          metadata: content.metadata || {},
          changeMessage: 'Manual save',
        });
      }
      onSave?.(content as Content);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const publishedContent = {
        ...content,
        status: 'published' as ContentStatus,
        publishedAt: new Date(),
      };
      setContent(publishedContent);
      onPublish?.(publishedContent as Content);
    } catch (error) {
      console.error('Publish failed:', error);
      alert('Failed to publish content');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = (scheduledDate: Date) => {
    setContent((prev) => ({
      ...prev,
      status: 'scheduled' as ContentStatus,
      scheduledAt: scheduledDate,
    }));
  };

  const addTag = () => {
    if (newTag && !content.tags?.includes(newTag)) {
      setContent((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setContent((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  const addCategory = () => {
    if (newCategory && !content.categories?.includes(newCategory)) {
      setContent((prev) => ({
        ...prev,
        categories: [...(prev.categories || []), newCategory],
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setContent((prev) => ({
      ...prev,
      categories: prev.categories?.filter((c) => c !== category) || [],
    }));
  };

  const addKeyword = () => {
    if (newKeyword && !content.seo?.keywords?.includes(newKeyword)) {
      setContent((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          keywords: [...(prev.seo?.keywords || []), newKeyword],
        },
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setContent((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo?.keywords?.filter((k) => k !== keyword) || [],
      },
    }));
  };

  const insertMediaIntoContent = (mediaUrl: string) => {
    setContent((prev) => ({
      ...prev,
      content: (prev.content || '') + `<img src="${mediaUrl}" alt="Inserted media" />`,
    }));
    setShowMediaLibrary(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Content Title"
                className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
              <input
                type="text"
                value={content.slug || ''}
                onChange={(e) => setContent({ ...content, slug: e.target.value })}
                placeholder="url-slug"
                className="w-full text-sm text-gray-500 dark:text-gray-400 bg-transparent border-none focus:outline-none mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handlePublish}
                disabled={isSaving || !content.title || !content.content}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                Publish
              </button>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="max-w-4xl mx-auto">
            {/* Excerpt */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Excerpt
              </label>
              <textarea
                value={content.excerpt || ''}
                onChange={(e) => setContent({ ...content, excerpt: e.target.value })}
                placeholder="Brief description (shown in previews and search results)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Rich Text Editor */}
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <RichTextEditor
                content={content.content}
                onChange={handleContentChange}
                placeholder="Start writing your content..."
                autoSave={true}
                onAutoSave={handleAutoSave}
              />
            </div>

            {/* Media Insert Button */}
            <button
              onClick={() => setShowMediaLibrary(true)}
              className="mt-4 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <ImageIcon className="w-4 h-4" />
              Insert Media
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Status & Type */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Document Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={content.type || 'page'}
                  onChange={(e) => setContent({ ...content, type: e.target.value as ContentType })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="page">Page</option>
                  <option value="blog">Blog Post</option>
                  <option value="project">Project</option>
                  <option value="event">Event</option>
                  <option value="email">Email</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={content.status || 'draft'}
                  onChange={(e) => setContent({ ...content, status: e.target.value as ContentStatus })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {content.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded text-xs"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-indigo-900 dark:hover:text-indigo-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Categories
            </h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                placeholder="Add category..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={addCategory}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {content.categories?.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs"
                >
                  {category}
                  <button onClick={() => removeCategory(category)} className="hover:text-green-900 dark:hover:text-green-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* SEO Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              SEO Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={content.seo?.metaTitle || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      seo: { ...content.seo, metaTitle: e.target.value },
                    })
                  }
                  placeholder="SEO title"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meta Description
                </label>
                <textarea
                  value={content.seo?.metaDescription || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      seo: { ...content.seo, metaDescription: e.target.value },
                    })
                  }
                  placeholder="SEO description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keywords
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    placeholder="Add keyword..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={addKeyword}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {content.seo?.keywords?.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                    >
                      {keyword}
                      <button onClick={() => removeKeyword(keyword)} className="hover:text-blue-900 dark:hover:text-blue-100">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          {content.status === 'scheduled' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Schedule
              </h3>
              <input
                type="datetime-local"
                value={
                  content.scheduledAt
                    ? new Date(content.scheduledAt).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setContent({ ...content, scheduledAt: new Date(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Media Library</h2>
              <button
                onClick={() => setShowMediaLibrary(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <MediaLibrary
                onSelectMedia={(media) => insertMediaIntoContent(media.url)}
                selectionMode={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentEditor;
