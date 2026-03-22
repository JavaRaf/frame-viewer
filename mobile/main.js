const seasons = {
    "1": {
        name: "Season 1", 
        user_name: "JavaRaf", 
        repo: "frames", 
        branch: "main",
        img_fps: 3.5,
        episodes: {
            1: { name: "Episode 1", frames: 5460 }, 2: { name: "Episode 2", frames: 5460 }, 3: { name: "Episode 3", frames: 5145 }, 4: { name: "Episode 4", frames: 5459 },
            5: { name: "Episode 5", frames: 5145 }, 6: { name: "Episode 6", frames: 5145 }, 7: { name: "Episode 7", frames: 5145 }, 8: { name: "Episode 8", frames: 5145 },
            9: { name: "Episode 9", frames: 5145 }, 10: { name: "Episode 10", frames: 5145 }, 11: { name: "Episode 11", frames: 5145 }, 12: { name: "Episode 12", frames: 5145 },
            13: { name: "Episode 13", frames: 5145 }, 14: { name: "Episode 14", frames: 5145 }, 15: { name: "Episode 15", frames: 5145 }, 16: { name: "Episode 16", frames: 5061 },
            17: { name: "Episode 17", frames: 5145 }, 18: { name: "Episode 18", frames: 5145 }, 19: { name: "Episode 19", frames: 5145 }, 20: { name: "Episode 20", frames: 5145 },
            21: { name: "Episode 21", frames: 5145 }, 22: { name: "Episode 22", frames: 5145 }, 23: { name: "Episode 23", frames: 5145 }, 24: { name: "Episode 24", frames: 5145 },
            25: { name: "Episode 25", frames: 5145 }, 26: { name: "Episode 26", frames: 5061 }, 27: { name: "Episode 27", frames: 5145 }, 28: { name: "Episode 28", frames: 5121 }
        }
    },

    // Season 2 
    "2": {
        name: "Season 2",
        user_name: "JavaRaf",
        repo: "season2",
        branch: "master",
        img_fps: 3.5,
        episodes: {
            1: { name: "Episode 1", frames: 5040 }, 2: { name: "Episode 2", frames: 5040 }, 3: { name: "Episode 3", frames: 5040 }, 4: { name: "Episode 4", frames: 5040 },
            5: { name: "Episode 5", frames: 5040 }, 6: { name: "Episode 6", frames: 5040 }, 7: { name: "Episode 7", frames: 5040 }, 8: { name: "Episode 8", frames: 5040 }, 
            9: { name: "Episode 9", frames: 5040 }
        }
    }
};


// github base url
base_url = "https://raw.githubusercontent.com";


// buttons
const prev_btn = document.getElementById("prev-btn");
const next_btn = document.getElementById("next-btn");
const random_btn = document.getElementById("random-btn");
const download_btn = document.getElementById("download-btn");

// lists
const season_list = document.getElementById("season-list");
const episode_list = document.getElementById("episode-list");

// image
const current_image = document.getElementById("current-image");

// input
const frame_input = document.getElementById("frame-input");

// progress bar
const progress_bar = document.getElementById("progress-bar");
const current_time_display = document.getElementById("current-time");
const total_time_display = document.getElementById("total-time");

// error message
const errMsgView = document.getElementById('err-msg-view');

// spinner
const spinner = document.querySelector('.spinner');

// global variables
global_season = null;
global_episode = null;
global_frame = null;

// Debounce timer for progress bar to avoid overload when dragging
let progress_bar_timeout = null;

// event listeners for season, episode and frame change -------------------------------------------------------
season_list.addEventListener('change', function() {
    if (seasons[this.value]) {
        global_season = this.value;
        global_episode = 1;
        set_episode();
        // Load frame from input or random if input is empty
        load_frame_from_input_or_random();
    }
});

episode_list.addEventListener('change', function() {
    if (seasons[global_season] && seasons[global_season].episodes[this.value]) {
        global_episode = parseInt(this.value);
        // Load frame from input or random if input is empty
        load_frame_from_input_or_random();
    }
});

// Remove os eventos anteriores
frame_input.removeEventListener('change', null);
frame_input.removeEventListener('keypress', null);

// Adiciona apenas o evento input
frame_input.addEventListener('input', function() {
    const frame_number = parseInt(this.value);
    if (!isNaN(frame_number)) {
        load_frame(frame_number);
    }
});

// Event listener for progress bar with debounce to avoid overload when dragging
progress_bar.addEventListener('input', function() {
    // Clear previous timeout if user is still dragging
    if (progress_bar_timeout) {
        clearTimeout(progress_bar_timeout);
    }
    
    // Wait 50ms before loading frame to avoid overload
    progress_bar_timeout = setTimeout(() => {
        const max_frames = seasons[global_season].episodes[global_episode].frames;
        const progress_percentage = parseFloat(this.value);
        const target_frame = Math.round(1 + (progress_percentage / 100) * (max_frames - 1));
        
        // Clamp frame to valid range
        const clamped_frame = Math.max(1, Math.min(target_frame, max_frames));
        load_frame(clamped_frame);
        
        progress_bar_timeout = null;
    }, 50);
});

document.addEventListener('DOMContentLoaded', function() {
    set_season();
    set_episode();
    loadFromURL();
});

// -----------------------------------------------------------------------------------------------------------



function set_season() {
    // Clear existing options
    season_list.innerHTML = '';
    
    // Add available seasons from the seasons object
    for (const [seasonId, seasonData] of Object.entries(seasons)) {
        const option = document.createElement('option');
        option.value = seasonId;
        option.textContent = seasonData.name;
        season_list.appendChild(option);
    }

    // Set default season if none is selected
    if (global_season == null) {
        // Get all season IDs as strings and pick a random one
        const seasonIds = Object.keys(seasons);
        global_season = seasonIds[Math.floor(Math.random() * seasonIds.length)];
        season_list.value = global_season;
    }
}



function set_episode() {
    // Clear existing options
    episode_list.innerHTML = '';
    
    // Add available episodes for the selected season
    for (const [episodeId, episodeData] of Object.entries(seasons[global_season].episodes)) {
        const option = document.createElement('option');
        option.value = episodeId;
        option.textContent = episodeData.name;
        episode_list.appendChild(option);
    }

    // Set default episode if none is selected
    if (global_episode == null) {
        global_episode = Math.floor(Math.random() * Object.keys(seasons[global_season].episodes).length) + 1;
        episode_list.value = global_episode;
    }
}


// Helper function to format time from seconds to "H:MM:SS.ms" format
function format_time_from_seconds(total_seconds) {
    const hours = Math.floor(total_seconds / 3600);
    const minutes = Math.floor((total_seconds % 3600) / 60);
    const seconds = total_seconds % 60;
    const milliseconds = (seconds - Math.floor(seconds)) * 100;

    return `${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}:${Math.floor(seconds).toString().padStart(2, '0')}.${milliseconds.toFixed(0).padStart(2, '0')}`;
}

// Helper function to convert frame number to seconds
function frame_to_seconds(frame_number) {
    const img_fps = seasons[global_season].img_fps;
    return frame_number / img_fps;
}

// Helper function to convert seconds to frame number
function seconds_to_frame(seconds) {
    const img_fps = seasons[global_season].img_fps;
    return Math.round(seconds * img_fps);
}

function set_timestamp() {
    const timestamp = document.getElementById("timestamp-btn");
    const current_seconds = frame_to_seconds(global_frame);
    timestamp.textContent = format_time_from_seconds(current_seconds);
    
    // Update progress bar and time displays
    update_progress_bar();
}

// Helper function to load frame from input or generate random frame if input is empty
function load_frame_from_input_or_random() {
    const inputFrame = parseInt(frame_input.value);
    if (!isNaN(inputFrame) && inputFrame > 0) {
        // Use frame from input if valid
        load_frame(inputFrame);
    } else {
        // Generate random frame if input is empty or invalid
        const max_frames = seasons[global_season].episodes[global_episode].frames;
        const random_frame = Math.floor(Math.random() * max_frames) + 1;
        load_frame(random_frame);
    }
}

// Update progress bar based on current frame
function update_progress_bar() {
    if (!global_season || !global_episode || !global_frame) return;
    
    const max_frames = seasons[global_season].episodes[global_episode].frames;
    const progress_percentage = ((global_frame - 1) / (max_frames - 1)) * 100;
    progress_bar.value = progress_percentage;
    
    // Update time displays
    const current_seconds = frame_to_seconds(global_frame);
    const total_seconds = frame_to_seconds(max_frames);
    
    current_time_display.textContent = format_time_from_seconds(current_seconds);
    total_time_display.textContent = format_time_from_seconds(total_seconds);
}


// keyboard navigation for frame
addEventListener('keydown', function(event) {
    // Prevent default behavior for arrow keys to avoid page scrolling
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowup', 'arrowright', 'arrowdown', 'a', 'w', 'd', 's'].includes(key)) {
        event.preventDefault();
        
        switch(key) {
            case 'arrowleft':
            case 'a':
                prev_frame();
                break;

            case 'arrowright': 
            case 'd':
                next_frame();
                break;
        }
    }
});


// keyboard navigation for episode
addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') {
        if (global_episode < Object.keys(seasons[global_season].episodes).length) {
            global_episode++;
            episode_list.value = global_episode;
        }
    } else if (key === 'arrowdown' || key === 's') {
        if (global_episode > 1) {
            global_episode--;
            episode_list.value = global_episode;
        }
    }

    load_frame(global_frame);
});


function load_frame(frame_number) {
    if (frame_number === null || frame_number === undefined) {
        console.error(`[load_frame] Frame number cannot be null or undefined`);
        errMsgView.style.display = 'flex';
        errMsgView.textContent = 'Invalid frame number. Please enter a valid frame.';
        return;
    }
    errMsgView.style.display = 'none';
    const max_frames = seasons[global_season].episodes[global_episode].frames;
    if (frame_number < 1 || frame_number > max_frames) {
        console.error(`Frame number out of range. Must be between 1 and ${max_frames}`);
        frame_input.value = global_frame; // Restaura o último frame válido
        return;
    }

    const image_url = `${base_url}/${seasons[global_season].user_name}/${seasons[global_season].repo}/${seasons[global_season].branch}/${global_episode.toString().padStart(2, '0')}/${frame_number.toString().padStart(4, '0')}.jpg`;
    const proxied_url = `https://images.weserv.nl/?url=${encodeURIComponent(image_url.replace(/^https?:\/\//, ''))}`;

    // Show spinner before loading image
    spinner.style.display = 'block';
    
    current_image.src = image_url;

    global_frame = frame_number;
    // Só atualiza o input se não estiver em foco
    if (document.activeElement !== frame_input) {
        frame_input.value = frame_number;
    }

    current_image.onload = () => {
        // Hide spinner when image loads
        spinner.style.display = 'none';
    };

    current_image.onerror = () => {
        // On error, try loading through proxy
        current_image.src = proxied_url;
        
        // Set new error handler for proxy attempt
        current_image.onerror = () => {
            spinner.style.display = 'none';
            errMsgView.style.display = 'flex';
            errMsgView.textContent = 'Error loading image. Choose another frame.';
        };
    };

    updateURL();
    set_timestamp();
}


// Navigation functions
function prev_frame() {
    if (global_frame > 1) {
        load_frame(global_frame - 1);
    }
}

function next_frame() {
    const max_frames = seasons[global_season].episodes[global_episode].frames;
    if (global_frame < max_frames) {
        load_frame(global_frame + 1);
    }
}

function random_frame() {
    // Keep current season, only change episode and frame
    global_episode = Math.floor(Math.random() * Object.keys(seasons[global_season].episodes).length) + 1;
    episode_list.value = global_episode;
    
    const max_frames = seasons[global_season].episodes[global_episode].frames;
    const random_frame = Math.floor(Math.random() * max_frames) + 1;

    load_frame(random_frame);
}

async function download_frame() {
    try {
        // Check if the image is loaded
        if (!current_image.complete || !current_image.naturalWidth) {
            errMsgView.style.display = 'flex';
            errMsgView.textContent = 'Wait for the image to load completely.';
            return;
        }

        // Check if the image URL is valid
        if (!current_image.src || current_image.src === window.location.href) {
            throw new Error('Invalid image URL');
        }

        // Fetch the image
        const response = await fetch(current_image.src);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get the image data as blob
        const blob = await response.blob();
        
        // Check if the blob has content
        if (blob.size === 0) {
            throw new Error('Empty or corrupted image');
        }
        
        // Create object URL
        const url = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `season${global_season}_episode${global_episode}_frame${global_frame.toString().padStart(4, '0')}.jpg`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(`[download_frame] Error downloading frame: ${error.message}`);
        errMsgView.style.display = 'flex';
        errMsgView.textContent = 'Error downloading frame. Please try again.';
    }
}

// Add event listeners for buttons
prev_btn.addEventListener('click', prev_frame);
next_btn.addEventListener('click', next_frame);
random_btn.addEventListener('click', random_frame);
download_btn.addEventListener('click', download_frame);

// URL Management functions
function updateURL() {
    const params = new URLSearchParams(window.location.search);
    params.set('season', global_season);
    params.set('episode', global_episode);
    params.set('frame', global_frame);
    
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newURL);
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const season = params.get('season');
    const episode = params.get('episode');
    const frame = params.get('frame');

    // Se não houver parâmetros na URL, aplica random frame
    if (!season && !episode && !frame) {
        global_season = Math.floor(Math.random() * Object.keys(seasons).length) + 1;
        global_episode = Math.floor(Math.random() * Object.keys(seasons[global_season].episodes).length) + 1;
        season_list.value = global_season;
        set_episode();
        random_frame();
        return;
    }

    if (season && Object.keys(seasons).includes(season)) {
        global_season = season;
        season_list.value = season;
        set_episode();
    }

    if (episode && Object.keys(seasons[global_season].episodes).includes(episode)) {
        global_episode = episode;
        episode_list.value = episode;
    }

    if (frame) {
        const frameNumber = parseInt(frame);
        if (!isNaN(frameNumber)) {
            load_frame(frameNumber);
        }
    }
}

// Add popstate event listener for browser back/forward buttons
window.addEventListener('popstate', function() {
    loadFromURL();
});