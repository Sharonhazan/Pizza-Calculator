/**
 * PWA SETUP
 * Creates a dynamic manifest for the application
 */
function setupPWA() {
    const manifest = {
        "name": "Pizza Dough Calculator",
        "short_name": "Pizza Calc",
        "start_url": ".",
        "display": "standalone",
        "background_color": "#ffffff",
        "description": "Calculate perfect pizza dough hydration and weights.",
        "theme_color": "#ef4444",
        "icons": [{
            "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjIwIiBmaWxsPSIjZWY0NDQ0Ii8+PHRleHQgeT0iLjllbSIgeD0iLjA1ZW0iIGZvbnQtc2l6ZT0iODAiIGZpbGw9IndoaXRlIj7wn4ySPC90ZXh0Pjwvc3ZnPg==",
            "sizes": "512x512",
            "type": "image/svg+xml"
        }]
    };
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    document.getElementById('pwa-manifest').setAttribute('href', manifestURL);
}

/**
 * SCREEN WAKE LOCK
 * Keeps the screen from turning off during baking
 */
let wakeLock = null;
const wakeBtn = document.getElementById('wakeLockBtn');
const wakeText = document.getElementById('wakeText');
const wakeIcon = document.getElementById('wakeIcon');

async function toggleWakeLock() {
    if (!('wakeLock' in navigator)) {
        console.warn("Wake Lock API not supported in this browser.");
        return;
    }

    try {
        if (wakeLock === null) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeText.innerText = "Screen Awake";
            wakeText.classList.add('wake-status-active');
            wakeIcon.innerText = "☀️";
            
            wakeLock.addEventListener('release', () => {
                wakeLock = null;
                resetWakeUI();
            });
        } else {
            await wakeLock.release();
            wakeLock = null;
        }
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

function resetWakeUI() {
    wakeText.innerText = "Stay Awake";
    wakeText.classList.remove('wake-status-active');
    wakeIcon.innerText = "🌙";
}

/**
 * CALCULATOR LOGIC
 * Handles ingredient ratios and dough weight math
 */
const RATIOS = { salt: 2.0, oil: 2.0, sugar: 0.5, yeast: 0.3 };

const inputs = {
    count: document.getElementById('countRange'),
    size: document.getElementById('sizeRange'),
    hydro: document.getElementById('hydroRange')
};

const displays = {
    count: document.getElementById('countValue'),
    size: document.getElementById('sizeValue'),
    inch: document.getElementById('inchValue'),
    hydroBadge: document.getElementById('hydroBadge'),
    total: document.getElementById('totalDough'),
    perPizza: document.getElementById('perPizza'),
    table: document.getElementById('ingredientBody'),
    printDetails: document.getElementById('printDetails'),
    kneadNote: document.getElementById('kneadNote')
};

function calculate() {
    const count = parseInt(inputs.count.value);
    const sizeCm = parseInt(inputs.size.value);
    const hydration = parseInt(inputs.hydro.value);
    
    // Formula for dough weight based on surface area
    const sizeInches = sizeCm / 2.54;
    const radius = sizeInches / 2;
    const area = Math.PI * (radius * radius);
    const doughWeightGrams = area * 2.41; // thickness factor 0.085 oz/in² converted
    
    const individualWeight = Math.round(doughWeightGrams);
    const totalWeight = individualWeight * count;

    // Update UI Elements
    displays.count.innerText = count;
    displays.size.innerText = sizeCm + 'cm';
    displays.inch.innerText = '~' + sizeInches.toFixed(1) + '"';
    displays.hydroBadge.innerText = hydration + '%';
    displays.total.innerText = totalWeight + 'g';
    displays.perPizza.innerText = `(${individualWeight}g per ball)`;
    
    if (displays.printDetails) {
        displays.printDetails.innerText = `${count} Pizzas @ ${sizeCm}cm (~${sizeInches.toFixed(1)}") at ${hydration}% Hydration`;
    }

    // Baker's Percentage Calculation
    const totalPercentage = 100 + hydration + RATIOS.salt + RATIOS.oil + RATIOS.sugar + RATIOS.yeast;
    const flourWeight = (totalWeight / totalPercentage) * 100;
    
    const ingredients = [
        { name: 'Bread Flour', pct: 100, weight: flourWeight },
        { name: 'Water', pct: hydration, weight: flourWeight * (hydration / 100) },
        { name: 'Salt', pct: RATIOS.salt, weight: flourWeight * 0.02 },
        { name: 'Olive Oil', pct: RATIOS.oil, weight: flourWeight * 0.02 },
        { name: 'Sugar', pct: RATIOS.sugar, weight: flourWeight * 0.005 },
        { name: 'Instant Yeast', pct: RATIOS.yeast, weight: flourWeight * 0.003 }
    ];

    displays.table.innerHTML = ingredients.map(ing => `
        <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
            <td class="p-4 text-sm text-slate-700 font-medium">${ing.name}</td>
            <td class="p-4 text-xs text-slate-400">${ing.pct}%</td>
            <td class="p-4 text-sm text-slate-900 font-bold text-right">${ing.weight.toFixed(1)}g</td>
        </tr>
    `).join('');

    // Dynamic advice
    if (hydration > 70) {
        displays.kneadNote.innerText = "(Note: Sticky dough. Use stretch & folds).";
    } else {
        displays.kneadNote.innerText = "";
    }
}

// Event Listeners
inputs.count.oninput = calculate;
inputs.size.oninput = calculate;
inputs.hydro.oninput = calculate;
wakeBtn.addEventListener('click', toggleWakeLock);

// Handle re-acquiring wake lock on visibility change
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        wakeLock = await navigator.wakeLock.request('screen');
    }
});

// Initialization
setupPWA();
calculate();