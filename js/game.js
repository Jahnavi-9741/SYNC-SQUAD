let detector, video, canvas, ctx, animationFrameId, demoCtx, demoAnimId, audioCtx;

async function startGame() {
    const btn = document.getElementById('start-btn');
    btn.disabled = true; 
    btn.classList.add('opacity-50');
    document.getElementById('loading-msg').classList.remove('hidden');
    
    // Init Audio Context Globally
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') await audioCtx.resume();
    } catch (e) { 
        console.warn("Audio Context Error", e); 
    }

    try {
        await initCamera();
        await createDetector();
        
        STATE.sessionStats = [];
        for(let i = 0; i < CONFIG.teamSize; i++) {
            const inputEl = document.getElementById(`p${i+1}-name`);
            const customName = inputEl && inputEl.value.trim() !== "" ? inputEl.value.trim().toUpperCase() : `OP-${i+1}`;
            STATE.sessionStats.push({ id: i + 1, name: customName, totalReps: 0 });
        }
        
        STATE.levelsConfig = [];
        const poolData = POOLS[CONFIG.difficulty];
        for(let i = 0; i < CONFIG.teamSize; i++) {
            const exKey = poolData.levels[i % poolData.levels.length];
            STATE.levelsConfig.push({ 
                id: i + 1, 
                exKey: exKey, 
                meta: EXERCISE_DB[exKey], 
                target: CONFIG.teamSize * 10, 
                duration: 0 
            });
        }
        STATE.levelsConfig.push({ 
            id: CONFIG.teamSize + 1, 
            exKey: poolData.finale, 
            meta: EXERCISE_DB[poolData.finale], 
            target: CONFIG.teamSize * 15, 
            duration: 0 
        });

        document.getElementById('lobby-screen').classList.add('opacity-0');
        setTimeout(() => {
            document.getElementById('lobby-screen').classList.add('hidden');
            document.getElementById('game-hud').classList.remove('hidden');
            demoCtx = document.getElementById('demo-canvas').getContext('2d');
            startLevel(0); 
        }, 500);
    } catch (err) {
        console.error(err);
        alert("Error: Camera access denied. Use HTTPS and grant camera permission.");
        btn.disabled = false;
        btn.classList.remove('opacity-50');
    }
}

function updateHUD() {
    document.getElementById('hud-level').innerText = STATE.level;
    document.getElementById('hud-exercise').innerText = STATE.currentLevelData.meta.name;
    document.getElementById('hud-reps').innerText = STATE.reps;
    document.getElementById('hud-target').innerText = STATE.targetReps;
    document.getElementById('progress-fill').style.width = `${Math.min(100, (STATE.reps / STATE.targetReps) * 100)}%`;
}

function showSummary() {
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('summary-screen').classList.remove('hidden');
    
    const tl = document.getElementById('timeline-grid'); 
    tl.innerHTML = '';
    STATE.levelsConfig.forEach(lvl => {
        tl.innerHTML += `
            <div class="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                <div>
                    <span class="text-xs text-blue-400 font-bold block mb-1">PHASE 0${lvl.id}</span>
                    <span class="text-white text-lg font-sport tracking-wide">${lvl.meta.name}</span>
                </div>
                <span class="text-green-400 font-mono">${lvl.duration.toFixed(1)}s</span>
            </div>
        `;
    });
    
    const st = document.getElementById('stats-grid'); 
    st.innerHTML = '';
    STATE.sessionStats.forEach(p => {
        const c = STATE.totalTeamReps > 0 ? Math.round((p.totalReps / STATE.totalTeamReps) * 100) : 0;
        st.innerHTML += `
            <div class="glass-panel p-6 rounded-2xl border-l-4 border-rose-500 flex flex-col justify-between">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="text-xs text-rose-400 uppercase tracking-widest font-bold mb-1">UNIT ${p.id}</div>
                        <div class="text-3xl font-sport text-white">${p.name}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-4xl font-sport text-green-400">${c}%</div>
                        <div class="text-[10px] text-gray-500 uppercase font-bold">CONTRIBUTION</div>
                    </div>
                </div>
                <div class="flex justify-between items-center border-t border-white/10 pt-4">
                    <div class="text-white font-bold text-xl">
                        ${p.totalReps} <span class="text-xs text-gray-500 font-normal">REPS</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    document.getElementById('total-score').innerText = STATE.totalTeamReps;
    const sync = STATE.totalTeamReps > 0 ? Math.round(100 * STATE.totalTeamReps / STATE.levelsConfig.reduce((sum, lvl) => sum + lvl.target, 0)) : 0;
    document.getElementById('final-sync').innerText = `${sync}%`;
}

function speak(text) { 
    if(window.speechSynthesis) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(text); 
        u.rate = 1.1; 
        window.speechSynthesis.speak(u); 
    }
}

function playSound(type) {
    if(!audioCtx) return;
    const o = audioCtx.createOscillator(); 
    const g = audioCtx.createGain();
    o.connect(g); 
    g.connect(audioCtx.destination);
    
    if(type === 'beep') { 
        o.frequency.setValueAtTime(600, audioCtx.currentTime); 
        o.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1); 
        g.gain.setValueAtTime(0.1, audioCtx.currentTime); 
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); 
        o.start(); 
        o.stop(audioCtx.currentTime + 0.1); 
    } else { 
        o.type = 'triangle'; 
        o.frequency.setValueAtTime(150, audioCtx.currentTime); 
        g.gain.setValueAtTime(0.1, audioCtx.currentTime); 
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5); 
        o.start(); 
        o.stop(audioCtx.currentTime + 0.5); 
    }
}
