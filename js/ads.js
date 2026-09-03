/* Ad integration layer.
   Default DISABLED. To enable after Google AdSense approval:
   1) Paste your AdSense <script> into index.html <head> (see README step 4).
   2) Flip ENABLED to true below.
   3) (Optional, higher revenue) wire showRewarded() to a rewarded-video SDK
      such as AdSense for Games / Ezoic Rewarded Ads / a custom ad network. */
(function (global) {
  'use strict';
  var ENABLED = false;

  global.AdMgr = {
    enabled: ENABLED,

    // Whether the "watch ad to revive" button should be visible.
    hasRewarded: function () {
      return ENABLED && typeof global.rewardedAdAvailable === 'function' && !!global.rewardedAdAvailable();
    },

    // Call cb(true) after the user finishes a rewarded video; cb(false) if cancelled / unavailable.
    showRewarded: function (cb) {
      if (!ENABLED) {
        if (cb) cb(false);
        return;
      }
      // --- Hook point: insert your rewarded-video SDK call here. ---
      // Example: if (global.RewardedShow) { global.RewardedShow(function (ok) { cb && cb(!!ok); }); return; }
      if (cb) cb(false);
    },

    // Called at lifecycle moments so future analytics / ad networks can hook in.
    notifyEvent: function (name) {
      // Hook point, e.g. console.log('[ad]', name);
    }
  };
})(window);
