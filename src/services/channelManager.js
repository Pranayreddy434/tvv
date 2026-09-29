/**
 * Admin-Friendly Channel Management Architecture
 * Provides modular schema validation, local overrides, and CRUD operations
 * designed for future administrative dashboards or playlist extensions.
 */

import { DEFAULT_CHANNELS } from '../data/defaultChannels';

const STORAGE_KEY_CUSTOM_CHANNELS = 'iptv_custom_channels';
const STORAGE_KEY_DISABLED_CHANNELS = 'iptv_disabled_channels';

export class ChannelManager {
  static getCustomChannels() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CUSTOM_CHANNELS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getDisabledChannelIds() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DISABLED_CHANNELS);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch {
      return new Set();
    }
  }

  /**
   * Combine built-in default channels with custom user/admin channels
   */
  static getActiveChannels(m3uChannels = []) {
    const custom = this.getCustomChannels();
    const disabledIds = this.getDisabledChannelIds();

    // Map default channels
    const combined = [...DEFAULT_CHANNELS];

    // Merge custom overrides or additions
    custom.forEach(c => {
      const existingIdx = combined.findIndex(ex => ex.id === c.id);
      if (existingIdx >= 0) {
        combined[existingIdx] = { ...combined[existingIdx], ...c };
      } else {
        combined.push(c);
      }
    });

    // Merge parsed M3U channels if provided (avoiding duplicates)
    if (m3uChannels && m3uChannels.length > 0) {
      const existingUrls = new Set(combined.map(c => c.url));
      m3uChannels.forEach((ch, idx) => {
        if (!existingUrls.has(ch.url)) {
          combined.push({
            ...ch,
            streamUrl: ch.url,
            channelNumber: ch.channelNumber || (combined.length + idx + 1),
            categories: ch.allGroups || [ch.group || 'General'],
            status: 'online',
            isNew: false
          });
        }
      });
    }

    // Filter out disabled channels unless requested
    return combined.filter(c => !disabledIds.has(c.id));
  }

  /**
   * Add a new channel (Admin API ready)
   */
  static addChannel(channelData) {
    if (!channelData.name || !channelData.url) {
      throw new Error('Channel name and stream URL are required');
    }

    const newChannel = {
      id: channelData.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      channelNumber: channelData.channelNumber || (DEFAULT_CHANNELS.length + 1),
      name: channelData.name.trim(),
      logo: channelData.logo || '',
      streamUrl: channelData.url || channelData.streamUrl,
      url: channelData.url || channelData.streamUrl,
      language: channelData.language || 'English',
      categories: Array.isArray(channelData.categories) ? channelData.categories : [channelData.group || 'General'],
      group: channelData.group || 'General',
      quality: channelData.quality || 'HD',
      status: 'online',
      isNew: channelData.isNew !== undefined ? channelData.isNew : true,
      featured: Boolean(channelData.featured),
      description: channelData.description || 'Custom user stream'
    };

    const custom = this.getCustomChannels();
    custom.push(newChannel);
    localStorage.setItem(STORAGE_KEY_CUSTOM_CHANNELS, JSON.stringify(custom));
    return newChannel;
  }

  /**
   * Edit channel properties
   */
  static updateChannel(id, updates) {
    const custom = this.getCustomChannels();
    const idx = custom.findIndex(c => c.id === id);
    if (idx >= 0) {
      custom[idx] = { ...custom[idx], ...updates };
    } else {
      // Find from default channels and create an override
      const def = DEFAULT_CHANNELS.find(c => c.id === id);
      if (def) {
        custom.push({ ...def, ...updates });
      }
    }
    localStorage.setItem(STORAGE_KEY_CUSTOM_CHANNELS, JSON.stringify(custom));
  }

  /**
   * Enable/Disable a channel
   */
  static toggleChannelStatus(id, enabled) {
    const disabled = this.getDisabledChannelIds();
    if (enabled) {
      disabled.delete(id);
    } else {
      disabled.add(id);
    }
    localStorage.setItem(STORAGE_KEY_DISABLED_CHANNELS, JSON.stringify(Array.from(disabled)));
  }

  /**
   * Delete custom channel
   */
  static deleteChannel(id) {
    let custom = this.getCustomChannels();
    custom = custom.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CUSTOM_CHANNELS, JSON.stringify(custom));
  }

  /**
   * Export channel database as JSON
   */
  static exportBackup() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      channels: this.getActiveChannels()
    }, null, 2);
  }
}
