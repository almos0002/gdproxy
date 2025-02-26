// GDPlayer Proxy Worker Script
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Main request handler
 * @param {Request} request - The incoming request
 */
async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname
  
  // Serve the index page for root path
  if (path === '/' || path === '/index.html') {
    return serveIndexPage()
  }
  
  // API endpoint to get the video slug
  if (path === '/api/get-video') {
    return handleGetVideo(request)
  }
  
  // Handle video streaming request
  if (path.startsWith('/watch/')) {
    return handleWatchVideo(request, path)
  }
  
  // Handle video streaming with quality parameter
  if (path.startsWith('/stream/')) {
    return handleStreamVideo(request, path)
  }
  
  // Serve the player.js file
  if (path === '/player.js') {
    return servePlayerJs()
  }
  
  // Handle 404 for any other path
  return new Response('Not Found', { status: 404 })
}

/**
 * Serves the index page
 */
async function serveIndexPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GDrive Video Proxy</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
    }
    input[type="text"] {
      width: 100%;
      padding: 10px;
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button {
      background-color: #4285f4;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background-color: #3367d6;
    }
    #result {
      margin-top: 20px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #f9f9f9;
      display: none;
    }
    #videoContainer {
      margin-top: 20px;
      display: none;
    }
    video {
      width: 100%;
      border-radius: 4px;
    }
    .quality-buttons {
      margin-top: 10px;
      display: flex;
      gap: 10px;
    }
    .quality-btn {
      padding: 5px 15px;
      background-color: #eee;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
    }
    .quality-btn:hover, .quality-btn.active {
      background-color: #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Google Drive Video Proxy</h1>
    <p>Enter a Google Drive file ID to create a proxy stream:</p>
    
    <input type="text" id="fileId" placeholder="Google Drive File ID (e.g., 1bJBs59LNjxYghoTnc_q8FSaW0pHEaYg0)">
    <button onclick="getVideo()">Generate Stream</button>
    
    <div id="result"></div>
    
    <div id="videoContainer">
      <h2>Video Player</h2>
      <video id="videoPlayer" controls></video>
      <div class="quality-buttons">
        <button class="quality-btn" onclick="changeQuality('360')">360p</button>
        <button class="quality-btn" onclick="changeQuality('720')">720p</button>
        <button class="quality-btn" onclick="changeQuality('1080')">1080p</button>
      </div>
    </div>
  </div>

  <script>
    let currentSlug = '';
    let currentQuality = '720';
    
    async function getVideo() {
      const fileId = document.getElementById('fileId').value.trim();
      if (!fileId) {
        alert('Please enter a valid Google Drive file ID');
        return;
      }
      
      document.getElementById('result').style.display = 'block';
      document.getElementById('result').innerHTML = 'Loading...';
      
      try {
        const response = await fetch('/api/get-video?file_id=' + fileId);
        const data = await response.json();
        
        if (data.status === 'ok') {
          document.getElementById('result').innerHTML = 
            \`Success! Stream URL created:<br>
             <strong>Watch URL:</strong> <a href="/watch/\${data.data.slug}" target="_blank">/watch/\${data.data.slug}</a>\`;
          
          currentSlug = data.data.slug;
          document.getElementById('videoContainer').style.display = 'block';
          changeQuality(currentQuality);
        } else {
          document.getElementById('result').innerHTML = 'Error: ' + data.message;
        }
      } catch (error) {
        document.getElementById('result').innerHTML = 'Error: ' + error.message;
      }
    }
    
    function changeQuality(quality) {
      if (!currentSlug) return;
      
      currentQuality = quality;
      const videoUrl = \`/stream/\${currentSlug}/\${quality}\`;
      const videoPlayer = document.getElementById('videoPlayer');
      
      // Store the current time to resume playback after changing quality
      const currentTime = videoPlayer.currentTime;
      
      videoPlayer.src = videoUrl;
      videoPlayer.load();
      
      // Resume playback at the stored time
      videoPlayer.addEventListener('loadedmetadata', function() {
        videoPlayer.currentTime = currentTime;
        videoPlayer.play();
      }, { once: true });
      
      // Update active button
      document.querySelectorAll('.quality-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(\`.quality-btn[onclick="changeQuality('\${quality}')"]\`).classList.add('active');
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
    }
  })
}

/**
 * Handles the API request to get a video slug
 * @param {Request} request - The incoming request
 */
async function handleGetVideo(request) {
  const url = new URL(request.url)
  const fileId = url.searchParams.get('file_id')
  
  if (!fileId) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Missing file_id parameter'
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 400
    })
  }
  
  try {
    // Make a request to the gdplayer.vip API
    const response = await fetch(`https://gdplayer.vip/api/video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({ file_id: fileId })
    })
    
    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Failed to fetch video information: ' + error.message
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 500
    })
  }
}

/**
 * Handles the watch video page request
 * @param {Request} request - The incoming request
 * @param {string} path - The request path
 */
async function handleWatchVideo(request, path) {
  const slug = path.replace('/watch/', '')
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Watch Video</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #000;
      color: #fff;
    }
    .video-container {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    video {
      max-width: 100%;
      max-height: 80vh;
    }
    .quality-buttons {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
    .quality-btn {
      padding: 10px 20px;
      background-color: #333;
      color: #fff;
      border: 1px solid #555;
      border-radius: 4px;
      cursor: pointer;
    }
    .quality-btn:hover, .quality-btn.active {
      background-color: #555;
    }
  </style>
</head>
<body>
  <div class="video-container">
    <video id="videoPlayer" controls autoplay></video>
    <div class="quality-buttons">
      <button class="quality-btn" onclick="changeQuality('360')">360p</button>
      <button class="quality-btn active" onclick="changeQuality('720')">720p</button>
      <button class="quality-btn" onclick="changeQuality('1080')">1080p</button>
    </div>
  </div>

  <script>
    const slug = '${slug}';
    let currentQuality = '720';
    
    function changeQuality(quality) {
      currentQuality = quality;
      const videoUrl = \`/stream/\${slug}/\${quality}\`;
      const videoPlayer = document.getElementById('videoPlayer');
      
      // Store the current time to resume playback after changing quality
      const currentTime = videoPlayer.currentTime;
      const wasPlaying = !videoPlayer.paused;
      
      videoPlayer.src = videoUrl;
      videoPlayer.load();
      
      // Resume playback at the stored time
      videoPlayer.addEventListener('loadedmetadata', function() {
        videoPlayer.currentTime = currentTime;
        if (wasPlaying) {
          videoPlayer.play();
        }
      }, { once: true });
      
      // Update active button
      document.querySelectorAll('.quality-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(\`.quality-btn[onclick="changeQuality('\${quality}')"]\`).classList.add('active');
    }
    
    // Initial load
    changeQuality(currentQuality);
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
    }
  })
}

/**
 * Handles the video streaming request
 * @param {Request} request - The incoming request
 * @param {string} path - The request path
 */
async function handleStreamVideo(request, path) {
  // Extract slug and quality from path
  const matches = path.match(/\/stream\/([^\/]+)\/(\d+)/)
  
  if (!matches) {
    return new Response('Invalid stream URL', { status: 400 })
  }
  
  const slug = matches[1]
  const quality = matches[2]
  
  try {
    // First, fetch the embed page to extract needed parameters
    const embedResponse = await fetch(`https://gdplayer.vip/${slug}`)
    const embedHtml = await embedResponse.text()
    
    // Extract the video server URL and video ID from the page
    const serverUrlMatch = embedHtml.match(/ng-init="init\('[^']+', '([^']+)', '([^']+)'/)
    
    if (!serverUrlMatch) {
      return new Response('Could not extract video information', { status: 500 })
    }
    
    const serverUrl = serverUrlMatch[1]
    const videoId = serverUrlMatch[2]
    
    // Construct the video streaming URL
    const videoUrl = `${serverUrl}/?video_id=${videoId}&quality=${quality}&action=p`
    
    // Proxy the video stream
    return fetch(videoUrl, {
      headers: {
        'Referer': `https://gdplayer.vip/${slug}`,
        'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
  } catch (error) {
    return new Response(`Error streaming video: ${error.message}`, { status: 500 })
  }
}

/**
 * Serves the player.js file
 */
async function servePlayerJs() {
  const js = `/**
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
        console.log(\`\${lib.name} is already loaded\`);
        continue;
      }
      
      // Load CSS if needed
      if (lib.css) {
        await this.loadCSS(lib.css);
      }
      
      // Load script
      await this.loadScript(lib.script);
      
      console.log(\`\${lib.name} loaded successfully\`);
    }
  }
  
  /**
   * Check if a library is already loaded
   * @param {string} globalVar - The global variable to check
   * @return {boolean} - Whether the library is loaded
   */
  isLibraryLoaded(globalVar) {
    try {
      return eval(\`typeof \${globalVar} !== 'undefined'\`);
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
      link.onerror = () => reject(new Error(\`Failed to load CSS: \${url}\`));
      
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
      script.onerror = () => reject(new Error(\`Failed to load script: \${url}\`));
      
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
}`;

  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'max-age=3600'
    }
  });
}
