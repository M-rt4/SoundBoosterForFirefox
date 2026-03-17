document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('volume-slider');
    const volumeValueDisplay = document.getElementById('volume-value');
    const multiplierDisplay = document.getElementById('multiplier-value');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // Load saved settings
    browser.storage.local.get(["volume", "theme"]).then((data) => {
        // Volume logic
        const volume = data.volume !== undefined ? data.volume : 100;
        updateUI(volume);

        // Theme logic
        let theme = data.theme;
        if (!theme) {
            // Auto detect
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        setTheme(theme);
    });

    function updateUI(volume) {
        slider.value = volume;
        volumeValueDisplay.textContent = volume;
        multiplierDisplay.textContent = (volume / 100).toFixed(1);
    }

    function setVolume(volume) {
        volume = parseInt(volume);
        updateUI(volume);
        browser.storage.local.set({ volume });

        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
            if (tabs[0]) {
                browser.tabs.sendMessage(tabs[0].id, {
                    type: "SET_VOLUME",
                    volume: volume
                }).catch(() => {});
            }
        });
    }

    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        browser.storage.local.set({ theme });
        
        // Update icon
        if (theme === 'dark') {
            themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
        } else {
            themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
        }
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    slider.addEventListener('input', (e) => setVolume(e.target.value));

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => setVolume(btn.getAttribute('data-value')));
    });

    // Listen for system theme changes if no preference is saved
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        browser.storage.local.get("theme").then(data => {
            if (!data.theme) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    });
});
