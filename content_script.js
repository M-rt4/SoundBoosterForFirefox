(function() {
    let audioContext;
    let gainNode;
    let sources = new Map();

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
            
            // Load initial volume
            browser.storage.local.get("volume").then((data) => {
                if (data.volume !== undefined) {
                    setGain(data.volume);
                }
            });
        }
    }

    function captureMedia(element) {
        if (sources.has(element)) return;
        
        try {
            initAudio();
            const source = audioContext.createMediaElementSource(element);
            source.connect(gainNode);
            sources.set(element, source);
        } catch (e) {
            console.error("Sound Booster: Could not capture media element", e);
        }
    }

    function setGain(volume) {
        if (!gainNode) return;
        // volume is 0 to 1000. 100 is normal (1x gain).
        // GainNode.gain.value 1 is 100%.
        const gainValue = volume / 100;
        gainNode.gain.setTargetAtTime(gainValue, audioContext.currentTime, 0.01);
    }

    // Monitor for new media elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === "VIDEO" || node.nodeName === "AUDIO") {
                    captureMedia(node);
                } else if (node.querySelectorAll) {
                    const media = node.querySelectorAll("video, audio");
                    media.forEach(captureMedia);
                }
            });
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // Capture existing elements
    document.querySelectorAll("video, audio").forEach(captureMedia);

    // Listen for volume updates
    browser.runtime.onMessage.addListener((message) => {
        if (message.type === "SET_VOLUME") {
            initAudio();
            setGain(message.volume);
        }
    });

    // Auto-resume AudioContext on user interaction (browser policy)
    const resumeAudio = () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        window.removeEventListener('click', resumeAudio);
        window.removeEventListener('keydown', resumeAudio);
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);

})();
