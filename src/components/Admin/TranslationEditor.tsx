/**
 * Translation Editor for Admin
 * Manage translations for English and Urdu
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/config';
import { translations } from '../../i18n/config';
import {
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface TranslationEntry {
  key: string;
  en: string;
  ur: string;
  category: string;
}

export const TranslationEditor: React.FC = () => {
  const { t, language } = useTranslation();
  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newEn, setNewEn] = useState('');
  const [newUr, setNewUr] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadTranslations();
  }, []);

  const loadTranslations = () => {
    const allEntries: TranslationEntry[] = [];

    const flatten = (obj: any, prefix = '', category = '') => {
      Object.keys(obj).forEach((key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, fullKey, prefix === '' ? key : category);
        } else if (typeof value === 'string') {
          const enValue = value;
          const urValue = getNestedValue(translations.ur, fullKey) || '';

          allEntries.push({
            key: fullKey,
            en: enValue,
            ur: urValue,
            category: category || 'general',
          });
        }
      });
    };

    flatten(translations.en);
    setEntries(allEntries);
  };

  const getNestedValue = (obj: any, path: string): string => {
    const keys = path.split('.');
    let value: any = obj;

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return '';
      }
    }

    return typeof value === 'string' ? value : '';
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.ur.includes(searchQuery);

    const matchesCategory =
      selectedCategory === 'all' || entry.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(entries.map((e) => e.category))];

  const handleSave = () => {
    setSaveStatus('saving');

    // In a real implementation, this would save to Firestore
    // For now, we'll simulate a save
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleExport = () => {
    const csv = [
      ['Key', 'English', 'Urdu', 'Category'].join(','),
      ...entries.map((e) => [
        e.key,
        `"${e.en.replace(/"/g, '""')}"`,
        `"${e.ur.replace(/"/g, '""')}"`,
        e.category,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translations_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddNew = () => {
    if (!newKey || !newEn || !newUr) {
      alert('Please fill all fields');
      return;
    }

    const newEntry: TranslationEntry = {
      key: newKey,
      en: newEn,
      ur: newUr,
      category: newKey.split('.')[0] || 'general',
    };

    setEntries([...entries, newEntry]);
    setNewKey('');
    setNewEn('');
    setNewUr('');
  };

  const handleDelete = (key: string) => {
    if (confirm(`Delete translation key "${key}"?`)) {
      setEntries(entries.filter((e) => e.key !== key));
    }
  };

  const handleUpdateEntry = (key: string, field: 'en' | 'ur', value: string) => {
    setEntries(
      entries.map((e) => (e.key === key ? { ...e, [field]: value } : e))
    );
  };

  const missingTranslations = entries.filter((e) => !e.ur).length;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('admin.translations')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage translations for English and Urdu
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Keys
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {entries.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Missing Translations
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {missingTranslations}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Completion Rate
          </div>
          <div className="text-2xl font-bold text-green-600">
            {((1 - missingTranslations / entries.length) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50"
        >
          {saveStatus === 'saving' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Saving...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>

        <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>Import CSV</span>
          <input type="file" accept=".csv" className="hidden" />
        </label>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search translations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Add New Translation */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Translation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key (e.g., common.welcome)"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            value={newEn}
            onChange={(e) => setNewEn(e.target.value)}
            placeholder="English"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            value={newUr}
            onChange={(e) => setNewUr(e.target.value)}
            placeholder="Urdu (اردو)"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right"
            dir="rtl"
          />
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Translations Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  English
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Urdu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEntries.map((entry) => (
                <tr
                  key={entry.key}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                    {entry.key}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={entry.en}
                      onChange={(e) =>
                        handleUpdateEntry(entry.key, 'en', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={entry.ur}
                      onChange={(e) =>
                        handleUpdateEntry(entry.key, 'ur', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right"
                      dir="rtl"
                      placeholder="Missing translation"
                    />
                    {!entry.ur && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Missing</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(entry.key)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No translations found
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredEntries.length} of {entries.length} translations
      </div>
    </div>
  );
};

export default TranslationEditor;
