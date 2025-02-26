/**
 * Video Player with built-in quality selector for HLS streams
 * Uses Video.js with the HLS quality selector plugin
 */

// Define the video player class
class GDrivePlayer {
  /**
   * Initialize the video player
   * @param {string} videoContainerId - The ID of the container element for the video player
   * @param {string} videoUrl - The HLS video URL to play
   * @param {Object} options - Additional player options
   */
  constructor(videoContainerId, videoUrl, options = {}) {
    this.videoContainerId = videoContainerId;
    this.videoUrl = videoUrl;
    this.options = Object.assign({
      autoplay: false,
      controls: true,
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 1, 1.5, 2],
    }, options);
    
    this.player = null;
    this.initialize();
  }
  
  /**
   * Initialize the video player with the required libraries
   */
  async initialize() {
    try {
      // Create container for player if it doesn't exist
      let containerElement = document.getElementById(this.videoContainerId);
      if (!containerElement) {
        containerElement = document.createElement('div');
        containerElement.id = this.videoContainerId;
        document.body.appendChild(containerElement);
      }
      
      // Create video element
      const videoElement = document.createElement('video');
      videoElement.className = 'video-js vjs-default-skin vjs-big-play-centered';
      videoElement.controls = true;
      containerElement.appendChild(videoElement);
      
      // Load required libraries
      await this.loadLibraries();
      
      // Initialize Video.js player
      this.player = videojs(videoElement, this.options);
      
      // Apply plugins once Video.js is ready
      this.player.ready(() => {
        // Initialize HLS
        if (this.player.hlsQualitySelector) {
          this.player.hlsQualitySelector({
            displayCurrentQuality: true
          });
        }
        
        // Set source and start loading
        this.setSource(this.videoUrl);
        
        // Log successful initialization
        console.log('GDrivePlayer initialized successfully');
      });
    } catch (error) {
      console.error('Error initializing GDrivePlayer:', error);
    }
  }
  
  /**
   * Load required libraries if they don't exist
   */
  async loadLibraries() {
    // Define the required libraries
    const libraries = [
      {
        name: 'video.js',
        global: 'videojs',
        css: 'https://cdn.jsdelivr.net/npm/video.js@7.11.4/dist/video-js.min.css',
        script: 'https://cdn.jsdelivr.net/npm/video.js@7.11.4/dist/video.min.js'
      },
      {
        name: 'hls.js',
        global: 'Hls',
        script: 'https://cdn.jsdelivr.net/npm/hls.js@1.1.5/dist/hls.min.js'
      },
      {
        name: 'videojs-contrib-quality-levels',
        global: 'window.videojs.getPlugin("qualityLevels")',
        script: 'https://cdn.jsdelivr.net/npm/videojs-contrib-quality-levels@2.1.0/dist/videojs-contrib-quality-levels.min.js'
      },
      {
        name: 'videojs-hls-quality-selector',
        global: 'window.videojs.getPlugin("hlsQualitySelector")',
        script: 'https://cdn.jsdelivr.net/npm/videojs-hls-quality-selector@1.1.4/dist/videojs-hls-quality-selector.min.js'
      }
    ];
    
    // Load each library if it's not already loaded
    for (const lib of libraries) {
      // Check if the library is already loaded
      if (this.isLibraryLoaded(lib.global)) {
        console.log(`${lib.name} is already loaded`);
        continue;
      }
      
      // Load CSS if needed
      if (lib.css) {
        await this.loadCSS(lib.css);
      }
      
      // Load script
      await this.loadScript(lib.script);
      
      console.log(`${lib.name} loaded successfully`);
    }
  }
  
  /**
   * Check if a library is already loaded
   * @param {string} globalVar - The global variable to check
   * @return {boolean} - Whether the library is loaded
   */
  isLibraryLoaded(globalVar) {
    try {
      return eval(`typeof ${globalVar} !== 'undefined'`);
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Load a CSS file
   * @param {string} url - The URL of the CSS file
   * @return {Promise} - A promise that resolves when the CSS is loaded
   */
  loadCSS(url) {
    return new Promise((resolve, reject) => {
      // Check if this CSS is already loaded
      const existingLinks = document.querySelectorAll('link[rel="stylesheet"]');
      for (let i = 0; i < existingLinks.length; i++) {
        if (existingLinks[i].href === url) {
          resolve();
          return;
        }
      }
      
      // Create and append the link element
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
      
      document.head.appendChild(link);
    });
  }
  
  /**
   * Load a JavaScript file
   * @param {string} url - The URL of the JavaScript file
   * @return {Promise} - A promise that resolves when the script is loaded
   */
  loadScript(url) {
    return new Promise((resolve, reject) => {
      // Check if this script is already loaded
      const existingScripts = document.querySelectorAll('script');
      for (let i = 0; i < existingScripts.length; i++) {
        if (existingScripts[i].src === url) {
          resolve();
          return;
        }
      }
      
      // Create and append the script element
      const script = document.createElement('script');
      script.src = url;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      
      document.body.appendChild(script);
    });
  }
  
  /**
   * Set the video source
   * @param {string} url - The URL of the video to play
   */
  setSource(url) {
    if (!this.player) {
      console.error('Player not initialized');
      return;
    }
    
    this.videoUrl = url;
    
    // Remove any existing source
    this.player.src('');
    
    // Set the new source
    if (url.includes('.m3u8')) {
      // For HLS streams
      this.player.src({
        src: url,
        type: 'application/x-mpegURL'
      });
    } else {
      // For direct MP4 streams
      this.player.src({
        src: url,
        type: 'video/mp4'
      });
    }
    
    // Start loading the video
    this.player.load();
  }
  
  /**
   * Play the video
   */
  play() {
    if (this.player) {
      this.player.play();
    }
  }
  
  /**
   * Pause the video
   */
  pause() {
    if (this.player) {
      this.player.pause();
    }
  }
  
  /**
   * Dispose the player
   */
  dispose() {
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
  }
}

// Export the player class
export default GDrivePlayer;
