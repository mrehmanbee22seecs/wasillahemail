/**
 * Media Library Component
 * Complete Cloudinary integration with upload, browse, search, and manage
 */

import React, { useState, useEffect } from 'react';
import { uploadMedia, getMediaLibrary, deleteMedia, updateMedia } from '../../services/mediaService';
import type { Media } from '../../types/cms';
import {
  Upload,
  Grid,
  List,
  Search,
  Filter,
  Trash2,
  Edit3,
  Check,
  X,
  Image as ImageIcon,
  Video,
  File,
  Download,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MediaLibraryProps {
  onSelectMedia?: (media: Media) => void;
  selectionMode?: boolean;
  multiSelect?: boolean;
  accept?: string;
  maxSize?: number;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelectMedia,
  selectionMode = false,
  multiSelect = false,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const { currentUser } = useAuth();
  const [media, setMedia] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load media library
  useEffect(() => {
    loadMedia();
  }, []);

  // Filter and sort media
  useEffect(() => {
    let filtered = [...media];

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((m) => m.type === filterType);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.fileName.toLowerCase().includes(query) ||
          m.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.uploadedAt.getTime() - a.uploadedAt.getTime();
        case 'oldest':
          return a.uploadedAt.getTime() - b.uploadedAt.getTime();
        case 'name':
          return a.fileName.localeCompare(b.fileName);
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });

    setFilteredMedia(filtered);
  }, [media, filterType, searchQuery, sortBy]);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const mediaList = await getMediaLibrary({});
      setMedia(mediaList);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!currentUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file size
        if (file.size > maxSize) {
          alert(`File ${file.name} exceeds maximum size of ${maxSize / 1024 / 1024}MB`);
          return null;
        }

        const uploaded = await uploadMedia(
          file,
          currentUser.uid,
          currentUser.displayName || 'Unknown User',
          {
            folder: 'cms',
            tags: [],
          }
        );

        setUploadProgress(((index + 1) / files.length) * 100);
        return uploaded;
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((r) => r !== null) as Media[];

      setMedia([...successfulUploads, ...media]);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload media');
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMediaSelect = (mediaItem: Media) => {
    if (selectionMode && onSelectMedia) {
      onSelectMedia(mediaItem);
      return;
    }

    if (multiSelect) {
      const newSelected = new Set(selectedMedia);
      if (newSelected.has(mediaItem.id)) {
        newSelected.delete(mediaItem.id);
      } else {
        newSelected.add(mediaItem.id);
      }
      setSelectedMedia(newSelected);
    } else {
      setSelectedMedia(new Set([mediaItem.id]));
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      await deleteMedia(mediaId);
      setMedia(media.filter((m) => m.id !== mediaId));
      selectedMedia.delete(mediaId);
      setSelectedMedia(new Set(selectedMedia));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete media');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedMedia.size} selected items?`)) return;

    try {
      await Promise.all(Array.from(selectedMedia).map((id) => deleteMedia(id)));
      setMedia(media.filter((m) => !selectedMedia.has(m.id)));
      setSelectedMedia(new Set());
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert('Failed to delete selected media');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copied to clipboard');
  };

  const downloadMedia = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-6 h-6" />;
      case 'video':
        return <Video className="w-6 h-6" />;
      default:
        return <File className="w-6 h-6" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search media..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="document">Documents</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="size">Size</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedMedia.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedMedia.size})
              </button>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer"
        >
          <input
            type="file"
            id="file-upload"
            multiple
            accept={accept}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Max size: {maxSize / 1024 / 1024}MB
            </p>
          </label>
          {isUploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Media Grid/List */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No media found</p>
            <p className="text-sm">Upload some files to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedia.map((mediaItem) => (
              <div
                key={mediaItem.id}
                onClick={() => handleMediaSelect(mediaItem)}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedMedia.has(mediaItem.id)
                    ? 'border-indigo-600 ring-2 ring-indigo-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                }`}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {mediaItem.type === 'image' ? (
                    <img
                      src={mediaItem.url}
                      alt={mediaItem.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">{getMediaIcon(mediaItem.type)}</div>
                  )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(mediaItem.url);
                      }}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadMedia(mediaItem.url, mediaItem.fileName);
                      }}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(mediaItem.id);
                      }}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2 bg-white dark:bg-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {mediaItem.fileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(mediaItem.size)}
                  </p>
                </div>

                {/* Selection Check */}
                {selectedMedia.has(mediaItem.id) && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMedia.map((mediaItem) => (
              <div
                key={mediaItem.id}
                onClick={() => handleMediaSelect(mediaItem)}
                className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMedia.has(mediaItem.id)
                    ? 'border-indigo-600 ring-2 ring-indigo-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {mediaItem.type === 'image' ? (
                    <img
                      src={mediaItem.url}
                      alt={mediaItem.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">{getMediaIcon(mediaItem.type)}</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{mediaItem.fileName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(mediaItem.size)} • {mediaItem.format.toUpperCase()} •{' '}
                    {new Date(mediaItem.uploadedAt).toLocaleDateString()}
                  </p>
                  {mediaItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mediaItem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(mediaItem.url);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Copy URL"
                  >
                    <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadMedia(mediaItem.url, mediaItem.fileName);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(mediaItem.id);
                    }}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                </div>

                {/* Selection Check */}
                {selectedMedia.has(mediaItem.id) && (
                  <div className="ml-2">
                    <div className="bg-indigo-600 text-white rounded-full p-1">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLibrary;
