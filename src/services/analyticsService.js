/**
 * Analytics-Ready Architecture
 * Clean, privacy-conscious event bus for observability and potential future integrations
 * (Google Analytics, Mixpanel, Plausible, or custom telemetry).
 * Zero invasive tracking by default.
 */

class AnalyticsService {
  constructor() {
    this.enabled = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    this.listeners = [];
  }

  /**
   * Subscribe to analytics events
   */
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  /**
   * Track an event safely
   */
  track(eventName, payload = {}) {
    const event = {
      event: eventName,
      timestamp: new Date().toISOString(),
      ...payload
    };

    // Notify custom subscribers
    this.listeners.forEach(fn => {
      try { fn(event); } catch (e) { /* ignore */ }
    });

    // In dev mode, emit clean structured console log
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
      // console.debug(`[Analytics: ${eventName}]`, payload);
    }
  }

  // Helper convenience methods
  channelPlay(channel) {
    this.track('channel_play', {
      channelId: channel?.id,
      channelNumber: channel?.channelNumber,
      channelName: channel?.name,
      category: channel?.group,
      quality: channel?.quality
    });
  }

  channelError(channel, errorMessage) {
    this.track('channel_error', {
      channelId: channel?.id,
      channelName: channel?.name,
      error: errorMessage
    });
  }

  favoriteAdded(channel) {
    this.track('favorite_added', { channelId: channel?.id, channelName: channel?.name });
  }

  favoriteRemoved(channel) {
    this.track('favorite_removed', { channelId: channel?.id, channelName: channel?.name });
  }

  searchPerformed(query, resultsCount) {
    this.track('search', { query, resultsCount });
  }

  categorySelected(category) {
    this.track('category_selected', { category });
  }

  fullscreenToggled(isFullscreen) {
    this.track('fullscreen', { isFullscreen });
  }

  pipToggled(isPip) {
    this.track('pip_enabled', { isPip });
  }

  channelNumberDialed(number) {
    this.track('channel_number_dialed', { number });
  }
}

export const analytics = new AnalyticsService();
