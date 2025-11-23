'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useApiKeys, useCreateApiKey, useUpdateApiKey, useDeleteApiKey } from '@/hooks/useApiKeys';
import { formatDate, formatDateTime } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import {
  Key,
  Plus,
  Copy,
  Check,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  Zap,
  Shield,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Globe,
  X,
} from 'lucide-react';

export default function ApiKeysPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ key: string; secret: string } | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedKeys, setCopiedKeys] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    name: '',
    rateLimit: '1000',
    permissions: {
      read: true,
      write: true,
      delete: false,
    },
    allowedDomains: [] as string[],
  });
  const [domainInput, setDomainInput] = useState('');
  const [editingDomains, setEditingDomains] = useState<Record<string, string[]>>({});

  const { data: apiKeys, isLoading } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const updateApiKey = useUpdateApiKey();
  const deleteApiKey = useDeleteApiKey();

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a name for the API key');
      return;
    }

    try {
      const result = await createApiKey.mutateAsync({
        name: formData.name,
        rateLimit: parseInt(formData.rateLimit),
        permissions: formData.permissions,
        allowedDomains: formData.allowedDomains,
      });

      if (result.success && result.data?.apiKey) {
        setNewKeyData({
          key: result.data.apiKey.key,
          secret: result.data.apiKey.secret,
        });
        setShowCreateModal(false);
        setShowKeyModal(true);
        setFormData({
          name: '',
          rateLimit: '1000',
          permissions: { read: true, write: true, delete: false },
          allowedDomains: [],
        });
        setDomainInput('');
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to create API key');
    }
  };

  const handleUpdate = async (id: string, updates: { name?: string; rateLimit?: number; isActive?: boolean; permissions?: any; allowedDomains?: string[] }) => {
    try {
      await updateApiKey.mutateAsync({ id, data: updates });
      setEditingKey(null);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to update API key');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      try {
        await deleteApiKey.mutateAsync(id);
      } catch (error: any) {
        alert(error?.response?.data?.message || 'Failed to delete API key');
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await handleUpdate(id, { isActive: !currentStatus });
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedKeys((prev) => ({ ...prev, [keyId]: true }));
      setTimeout(() => {
        setCopiedKeys((prev) => ({ ...prev, [keyId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback: show text in alert
      alert(`API Key: ${text}`);
    }
  };

  const toggleSecretVisibility = (keyId: string) => {
    setShowSecrets((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Loading API keys...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Key className="h-8 w-8 text-blue-600" />
              API Keys
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your API keys for programmatic access to the platform
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">API Key Security</h3>
              <ul className="mt-1 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>• Keep your API keys secret and never share them publicly</li>
                <li>• The secret is only shown once when you create the key</li>
                <li>• You can regenerate keys by deleting and creating new ones</li>
                <li>• Use rate limits to prevent abuse</li>
                <li>• Disable keys you're not using</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Keys List */}
        {apiKeys && apiKeys.length > 0 ? (
          <div className="space-y-4">
            {apiKeys.map((apiKey: any) => (
              <div
                key={apiKey.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                        <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {editingKey === apiKey.id ? (
                              <input
                                type="text"
                                defaultValue={apiKey.name}
                                onBlur={(e) => {
                                  if (e.target.value !== apiKey.name) {
                                    handleUpdate(apiKey.id, { name: e.target.value });
                                  }
                                  setEditingKey(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingKey(null);
                                  }
                                }}
                                className="rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                autoFocus
                              />
                            ) : (
                              <span onClick={() => setEditingKey(apiKey.id)} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                                {apiKey.name}
                              </span>
                            )}
                          </h3>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              apiKey.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {apiKey.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* API Key */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            API Key
                          </label>
                          <div className="mt-1 flex items-center gap-2">
                            <code className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm font-mono text-gray-900 dark:bg-gray-700 dark:text-white">
                              {apiKey.key}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(apiKey.key, `key-${apiKey.id}`)}
                            >
                              {copiedKeys[`key-${apiKey.id}`] ? (
                                <>
                                  <Check className="mr-1 h-4 w-4" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-1 h-4 w-4" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Secret (if available) */}
                        {newKeyData && newKeyData.key === apiKey.key && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Secret (shown only once)
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                              <code className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm font-mono text-gray-900 dark:bg-gray-700 dark:text-white">
                                {showSecrets[apiKey.id] ? newKeyData.secret : '•'.repeat(64)}
                              </code>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleSecretVisibility(apiKey.id)}
                              >
                                {showSecrets[apiKey.id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(newKeyData.secret, `secret-${apiKey.id}`)}
                              >
                                {copiedKeys[`secret-${apiKey.id}`] ? (
                                  <>
                                    <Check className="mr-1 h-4 w-4" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="mr-1 h-4 w-4" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              ⚠️ Save this secret now. You won't be able to see it again!
                            </p>
                          </div>
                        )}

                        {/* Allowed Domains */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Allowed Domains
                            </label>
                            <button
                              onClick={() => {
                                const currentDomains = editingDomains[apiKey.id] || apiKey.allowedDomains || [];
                                setEditingDomains({ ...editingDomains, [apiKey.id]: [...currentDomains] });
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              {editingDomains[apiKey.id] ? 'Cancel' : 'Edit'}
                            </button>
                          </div>
                          {editingDomains[apiKey.id] ? (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={domainInput}
                                  onChange={(e) => setDomainInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && domainInput.trim()) {
                                      e.preventDefault();
                                      const domains = editingDomains[apiKey.id] || [];
                                      if (!domains.includes(domainInput.trim())) {
                                        setEditingDomains({
                                          ...editingDomains,
                                          [apiKey.id]: [...domains, domainInput.trim()],
                                        });
                                        setDomainInput('');
                                      }
                                    }
                                  }}
                                  placeholder="example.com or *.example.com"
                                  className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const domains = editingDomains[apiKey.id] || [];
                                    if (domainInput.trim() && !domains.includes(domainInput.trim())) {
                                      setEditingDomains({
                                        ...editingDomains,
                                        [apiKey.id]: [...domains, domainInput.trim()],
                                      });
                                      setDomainInput('');
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(editingDomains[apiKey.id] || []).map((domain, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                  >
                                    <Globe className="h-3 w-3" />
                                    {domain}
                                    <button
                                      onClick={() => {
                                        const domains = editingDomains[apiKey.id] || [];
                                        setEditingDomains({
                                          ...editingDomains,
                                          [apiKey.id]: domains.filter((_, i) => i !== index),
                                        });
                                      }}
                                      className="hover:text-blue-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    await handleUpdate(apiKey.id, {
                                      allowedDomains: editingDomains[apiKey.id] || [],
                                    });
                                    setEditingDomains({ ...editingDomains, [apiKey.id]: undefined });
                                    setDomainInput('');
                                  }}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingDomains({ ...editingDomains, [apiKey.id]: undefined });
                                    setDomainInput('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {apiKey.allowedDomains && apiKey.allowedDomains.length > 0 ? (
                                apiKey.allowedDomains.map((domain: string, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                  >
                                    <Globe className="h-3 w-3" />
                                    {domain}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  All domains allowed
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Key Details */}
                        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Rate Limit</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                              {apiKey.rateLimit || 1000}/hour
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Created</p>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {formatDate(apiKey.createdAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Used</p>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {apiKey.lastUsed ? formatDateTime(apiKey.lastUsed) : 'Never'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Permissions</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {apiKey.permissions?.read && (
                                <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                  Read
                                </span>
                              )}
                              {apiKey.permissions?.write && (
                                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                  Write
                                </span>
                              )}
                              {apiKey.permissions?.delete && (
                                <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                  Delete
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(apiKey.id, apiKey.isActive)}
                      disabled={updateApiKey.isPending}
                    >
                      {apiKey.isActive ? (
                        <>
                          <ToggleRight className="mr-1 h-4 w-4" />
                          Disable
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="mr-1 h-4 w-4" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(apiKey.id)}
                      disabled={deleteApiKey.isPending}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <Key className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No API keys</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create your first API key to start using the API
            </p>
            <Button className="mt-6" onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Create API Key</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My API Key"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rate Limit (requests/hour)
                  </label>
                  <input
                    type="number"
                    value={formData.rateLimit}
                    onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
                    min="1"
                    max="10000"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Permissions
                  </label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions.read}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, read: e.target.checked },
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Read</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions.write}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, write: e.target.checked },
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Write</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions.delete}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: { ...formData.permissions, delete: e.target.checked },
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Delete</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allowed Domains (Optional)
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Restrict API key usage to specific domains. Leave empty to allow all domains.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && domainInput.trim()) {
                          e.preventDefault();
                          if (!formData.allowedDomains.includes(domainInput.trim())) {
                            setFormData({
                              ...formData,
                              allowedDomains: [...formData.allowedDomains, domainInput.trim()],
                            });
                            setDomainInput('');
                          }
                        }
                      }}
                      placeholder="example.com or *.example.com"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (domainInput.trim() && !formData.allowedDomains.includes(domainInput.trim())) {
                          setFormData({
                            ...formData,
                            allowedDomains: [...formData.allowedDomains, domainInput.trim()],
                          });
                          setDomainInput('');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.allowedDomains.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.allowedDomains.map((domain, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        >
                          <Globe className="h-3 w-3" />
                          {domain}
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                allowedDomains: formData.allowedDomains.filter((_, i) => i !== index),
                              });
                            }}
                            className="ml-1 hover:text-blue-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        name: '',
                        rateLimit: '1000',
                        permissions: { read: true, write: true, delete: false },
                        allowedDomains: [],
                      });
                      setDomainInput('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreate}
                    disabled={createApiKey.isPending}
                    isLoading={createApiKey.isPending}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show Key Modal */}
        {showKeyModal && newKeyData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    API Key Created Successfully
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Save your secret key now. You won't be able to see it again!
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    API Key
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm font-mono text-gray-900 dark:bg-gray-700 dark:text-white">
                      {newKeyData.key}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(newKeyData.key, 'new-key')}
                    >
                      {copiedKeys['new-key'] ? (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Secret Key
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm font-mono text-gray-900 dark:bg-gray-700 dark:text-white">
                      {newKeyData.secret}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(newKeyData.secret, 'new-secret')}
                    >
                      {copiedKeys['new-secret'] ? (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    ⚠️ This is the only time you'll see the secret key. Make sure to save it securely!
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    setShowKeyModal(false);
                    setNewKeyData(null);
                  }}
                >
                  I've Saved My Keys
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

