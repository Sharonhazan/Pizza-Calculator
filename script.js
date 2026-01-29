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
const inputs = {
    count: document.getElementById('countRange'),
    size: document.getElementById('sizeRange'),
    hydro: document.getElementById('hydroRange'),
    salt: document.getElementById('saltInput'),
    oil: document.getElementById('oilInput'),
    sugar: document.getElementById('sugarInput'),
    yeast: document.getElementById('yeastInput')
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
    const salt = parseFloat(inputs.salt.value);
    const oil = parseFloat(inputs.oil.value);
    const sugar = parseFloat(inputs.sugar.value);
    const yeast = parseFloat(inputs.yeast.value);
    
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
    const totalPercentage = 100 + hydration + salt + oil + sugar + yeast;
    const flourWeight = (totalWeight / totalPercentage) * 100;
    
    const ingredients = [
        { name: 'Bread Flour', pct: 100, weight: flourWeight },
        { name: 'Water', pct: hydration, weight: flourWeight * (hydration / 100) },
        { name: 'Salt', pct: salt, weight: flourWeight * (salt / 100) },
        { name: 'Olive Oil', pct: oil, weight: flourWeight * (oil / 100) },
        { name: 'Sugar', pct: sugar, weight: flourWeight * (sugar / 100) },
        { name: 'Instant Yeast', pct: yeast, weight: flourWeight * (yeast / 100) }
    ];

    displays.table.innerHTML = ingredients.map(ing => `
        <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
            <td class="p-4 text-sm text-slate-700 font-medium">${ing.name}${ing.pct !== 100 ? ` (${ing.pct}%)` : ''}</td>
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

// Advanced Settings Toggle
const advancedToggle = document.getElementById('advancedToggle');
const advancedPanel = document.getElementById('advancedPanel');
const advancedIcon = document.getElementById('advancedIcon');

advancedToggle.addEventListener('click', () => {
    const isHidden = advancedPanel.classList.contains('hidden');
    if (isHidden) {
        advancedPanel.classList.remove('hidden');
        advancedIcon.style.transform = 'rotate(180deg)';
    } else {
        advancedPanel.classList.add('hidden');
        advancedIcon.style.transform = 'rotate(0deg)';
    }
});

// Event Listeners
inputs.count.oninput = calculate;
inputs.size.oninput = calculate;
inputs.hydro.oninput = calculate;
inputs.salt.oninput = calculate;
inputs.oil.oninput = calculate;
inputs.sugar.oninput = calculate;
inputs.yeast.oninput = calculate;
wakeBtn.addEventListener('click', toggleWakeLock);

// Handle re-acquiring wake lock on visibility change
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        wakeLock = await navigator.wakeLock.request('screen');
    }
});

// Initialization
calculate();