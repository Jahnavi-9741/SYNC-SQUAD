/** UI LOGIC **/
window.onload = function() { 
    renderNameInputs(); 
    renderExercisePreview(); 
};

function adjustTeam(delta) {
    CONFIG.teamSize = Math.max(CONFIG.minTeam, Math.min(CONFIG.maxTeam, CONFIG.teamSize + delta));
    document.getElementById('team-size-display').innerText = CONFIG.teamSize;
    renderNameInputs(); 
    renderExercisePreview();
}

function setDifficulty(level) {
    CONFIG.difficulty = level;
    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('selected'));
    const map = { 'EASY': 'diff-easy', 'MEDIUM': 'diff-med', 'HARD': 'diff-hard' };
    document.getElementById(map[level]).classList.add('selected');
    renderExercisePreview();
}

function renderNameInputs() {
    const container = document.getElementById('player-inputs-container');
    container.innerHTML = '';
    for(let i = 1; i <= CONFIG.teamSize; i++) {
        let posLabel = "CENTER";
        // Positions from Left to Right
        if(CONFIG.teamSize === 2) posLabel = i === 1 ? "LEFT" : "RIGHT";
        if(CONFIG.teamSize === 3) posLabel = i === 1 ? "LEFT" : (i === 2 ? "CENTER" : "RIGHT");
        if(CONFIG.teamSize === 4) posLabel = i === 1 ? "FAR LEFT" : (i === 2 ? "MID LEFT" : (i === 3 ? "MID RIGHT" : "FAR RIGHT"));

        const div = document.createElement('div');
        div.innerHTML = `
            <input type="text" id="p${i}-name" placeholder="OP-${i}" maxlength="10" class="w-full bg-slate-800/50 border-b-2 border-slate-600 text-white font-sport text-xl p-2 text-center focus:outline-none focus:border-rose-500 placeholder-slate-600 uppercase rounded-t tracking-wider">
            <div class="text-[10px] text-blue-400 bg-slate-900/80 text-center py-1 rounded-b font-mono uppercase tracking-widest font-bold">${posLabel}</div>
        `;
        container.appendChild(div);
    }
}

function renderExercisePreview() {
    const container = document.getElementById('exercise-preview-container');
    container.innerHTML = '';
    const poolData = POOLS[CONFIG.difficulty];
    for(let i = 0; i < CONFIG.teamSize; i++) {
        const exKey = poolData.levels[i % poolData.levels.length];
        const meta = EXERCISE_DB[exKey];
        const div = document.createElement('div');
        div.className = "flex items-center gap-3 border-b border-white/5 pb-2 last:border-0";
        div.innerHTML = `
            <span class="text-rose-500 font-sport text-xl w-6">0${i+1}</span> 
            <span class="text-gray-300 font-bold">${meta.name}</span> 
            <span class="ml-auto text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">ALL SQUAD</span>
        `;
        container.appendChild(div);
    }
    const finaleMeta = EXERCISE_DB[poolData.finale];
    const finDiv = document.createElement('div');
    finDiv.className = "mt-2 pt-2 border-t border-white/10 flex items-center gap-3";
    finDiv.innerHTML = `
        <span class="text-blue-400 font-sport text-xl w-6">FN</span> 
        <span class="text-white font-bold tracking-wide">${finaleMeta.name}</span> 
        <span class="ml-auto text-[10px] bg-rose-900/50 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">FINALE</span>
    `;
    container.appendChild(finDiv);
}
