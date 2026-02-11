async function initCamera() {
    video = document.getElementById('video');
    canvas = document.getElementById('output');
    ctx = canvas.getContext('2d');
    const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: false, 
        video: { 
            width: CONFIG.width, 
            height: CONFIG.height, 
            facingMode: 'user' 
        } 
    });
    video.srcObject = stream;
    return new Promise(resolve => { 
        video.onloadedmetadata = () => { 
            video.play(); 
            video.width = CONFIG.width; 
            video.height = CONFIG.height; 
            canvas.width = CONFIG.width; 
            canvas.height = CONFIG.height; 
            resolve(video); 
        }; 
    });
}

async function createDetector() {
    const detectorConfig = { 
        modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING, 
        enableTracking: true, 
        trackerType: poseDetection.TrackerType.BoundingBox 
    };
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
}

function startLevel(lvlIndex) {
    STATE.levelIndex = lvlIndex;
    STATE.level = lvlIndex + 1;
    STATE.currentLevelData = STATE.levelsConfig[lvlIndex];
    STATE.reps = 0;
    STATE.targetReps = STATE.currentLevelData.target;
    STATE.timeRemaining = STATE.currentLevelData.meta.timeLimit;
    STATE.playerStates = new Array(CONFIG.teamSize).fill(null).map(() => ({ 
        state: 'START', 
        lastRepTime: 0 
    }));

    updateHUD();
    STATE.status = 'TRANSITION';
    const overlay = document.getElementById('overlay-msg');
    const meta = STATE.currentLevelData.meta;
    const isFinale = lvlIndex === STATE.levelsConfig.length - 1;

    document.getElementById('overlay-title').innerText = isFinale ? "FINALE" : `PHASE 0${STATE.level}`;
    document.getElementById('overlay-sub').innerText = meta.name;
    document.getElementById('overlay-instruction').innerText = meta.desc;
    
    const diffEl = document.getElementById('overlay-difficulty');
    diffEl.innerText = `${meta.diff} INTENSITY`;
    diffEl.className = `self-center md:self-start inline-block px-3 py-1 text-white font-bold text-xs rounded shadow-lg tracking-widest ${
        meta.diff === 'ELITE' || meta.diff === 'FINALE' ? 'bg-rose-600' : 
        (meta.diff === 'VETERAN' ? 'bg-yellow-500' : 'bg-green-500')
    }`;
    
    overlay.classList.remove('hidden');
    speak(`${isFinale ? 'Final Mission' : 'Phase ' + STATE.level}. ${meta.name}.`);
    startDemoAnimation(STATE.currentLevelData.exKey);

    let count = CONFIG.transitionTime;
    document.getElementById('countdown').innerText = count;
    const timer = setInterval(() => {
        count--; 
        document.getElementById('countdown').innerText = count;
        if(count <= 0) { 
            clearInterval(timer); 
            cancelAnimationFrame(demoAnimId); 
            overlay.classList.add('hidden'); 
            STATE.status = 'PLAYING'; 
            STATE.levelStartTime = Date.now(); 
            gameLoop(); 
        }
    }, 1000);
}

async function gameLoop() {
    if(STATE.status !== 'PLAYING') return;
    
    const remaining = Math.max(0, Math.ceil(STATE.currentLevelData.meta.timeLimit - (Date.now() - STATE.levelStartTime) / 1000));
    const tEl = document.getElementById('hud-timer');
    tEl.innerText = remaining < 10 ? `0${remaining}` : remaining;
    tEl.classList.toggle('text-rose-500', remaining <= 10);

    if(remaining <= 0) {
        STATE.currentLevelData.penalty = true; 
        playSound('fail'); 
        levelComplete(); 
        return;
    }

    const poses = await detector.estimatePoses(video, { 
        maxPoses: CONFIG.teamSize, 
        flipHorizontal: false 
    });
    STATE.poses = poses;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    processGameLoop(poses);
    drawSkeleton(poses);
    
    if(STATE.reps >= STATE.targetReps) { 
        levelComplete(); 
    } else { 
        animationFrameId = requestAnimationFrame(gameLoop); 
    }
}

function processGameLoop(poses) {
    // Sort poses by X position (Visual Left = High X due to mirror)
    poses.sort((a, b) => b.keypoints[0].x - a.keypoints[0].x);
    
    const exKey = STATE.currentLevelData.exKey;
    poses.forEach((pose, idx) => {
        if(pose.score < 0.3 || idx >= CONFIG.teamSize) return;
        const k = pose.keypoints;
        let isRep = false;
        
        // Exercise Detection Logic
        if (['FINALE_JACKS'].includes(exKey)) {
            isRep = checkState(idx, k[9].y < k[3].y && k[10].y < k[4].y, k[9].y > k[5].y);
        } else if (exKey === 'SQUATS') {
            const dist = Math.abs(((k[11].y + k[12].y) / 2) - ((k[13].y + k[14].y) / 2));
            isRep = checkState(idx, dist < 100, dist > 140);
        } else if (exKey === 'CRUNCHES') {
            const d1 = Math.hypot(k[7].x - k[14].x, k[7].y - k[14].y);
            isRep = checkState(idx, d1 < 160, d1 > 220);
        } else if (exKey === 'WINGS') {
            isRep = checkState(idx, Math.abs(k[9].y - k[5].y) < 60, k[9].y > k[5].y + 100);
        } else if (exKey === 'SIDEBEND') {
            const ang = Math.abs(Math.atan2(k[5].y - k[6].y, 100) * 180 / Math.PI);
            isRep = checkState(idx, ang > 20, ang < 10);
        } else if (exKey === 'HIGH_KNEES') {
            isRep = checkState(idx, k[13].y < k[11].y, k[13].y > k[11].y);
        } else if (['BOXING', 'FINALE_SPRINT'].includes(exKey)) {
            const cross = k[9].x > k[0].x + 20;
            isRep = checkState(idx, cross, !cross, 250);
        } else if (exKey === 'T_CLAPS') {
            const d = Math.abs(k[9].x - k[10].x);
            isRep = checkState(idx, d < 80, d > 200);
        } else if (exKey === 'WIDE_REACH') {
            isRep = checkState(idx, k[9].y < k[0].y, k[9].y > k[11].y);
        } else if (exKey === 'KNEE_SMASH') {
            isRep = checkState(idx, k[9].y > k[13].y - 50, k[9].y < k[0].y);
        } else if (exKey === 'LEG_LIFTS') {
            const d = Math.abs(k[15].y - k[16].y);
            isRep = checkState(idx, d > 50, d < 20);
        } else if (exKey === 'TOE_TOUCHES') {
            isRep = checkState(idx, k[9].y > k[11].y + 50, k[9].y < k[11].y);
        } else if (exKey === 'CLIMBERS') {
            const active = (k[9].y < k[0].y && k[14].y < k[12].y);
            isRep = checkState(idx, active, !active);
        }

        if (isRep) {
            STATE.reps++; 
            STATE.totalTeamReps++;
            if (STATE.sessionStats[idx]) STATE.sessionStats[idx].totalReps++;
            playSound('beep'); 
            updateHUD();
        }
    });
}

function checkState(idx, active, reset, debounce = 400) {
    const s = STATE.playerStates[idx];
    const now = Date.now();
    if (s.state === 'START' && active) s.state = 'MID';
    else if (s.state === 'MID' && reset) {
        if (now - s.lastRepTime > debounce) { 
            s.state = 'START'; 
            s.lastRepTime = now; 
            return true; 
        }
    }
    return false;
}

function levelComplete() {
    STATE.status = 'FINISHED';
    STATE.currentLevelData.duration = (Date.now() - STATE.levelStartTime) / 1000;
    speak("Phase Complete!");
    if(STATE.levelIndex < STATE.levelsConfig.length - 1) {
        setTimeout(() => startLevel(STATE.levelIndex + 1), 2000);
    } else {
        setTimeout(showSummary, 2000);
    }
}

function startDemoAnimation(type) {
    if(demoAnimId) cancelAnimationFrame(demoAnimId);
    const w = 240, h = 240, cx = w/2, cy = h/2;
    
    function draw(time) {
        demoCtx.clearRect(0, 0, w, h);
        demoCtx.strokeStyle = '#3b82f6'; 
        demoCtx.lineWidth = 5; 
        demoCtx.lineCap = 'round'; 
        demoCtx.lineJoin = 'round';
        
        const t = time * 0.005; 
        const c = (Math.sin(t) + 1) / 2;
        demoCtx.fillStyle = '#f43f5e'; 
        demoCtx.beginPath(); 
        demoCtx.arc(cx, 50, 15, 0, 6.28); 
        demoCtx.fill();
        demoCtx.beginPath(); 
        demoCtx.moveTo(cx, 70); 
        demoCtx.lineTo(cx, 130); 
        demoCtx.stroke();
        
        const limb = (x1, y1, x2, y2, x3, y3) => { 
            demoCtx.beginPath(); 
            demoCtx.moveTo(x1, y1); 
            demoCtx.lineTo(x2, y2); 
            if(x3) demoCtx.lineTo(x3, y3); 
            demoCtx.stroke(); 
        };
        
        if(['FINALE_JACKS'].includes(type)) { 
            const l = 10 + c * 40; 
            limb(cx, 130, cx - l, 200); 
            limb(cx, 130, cx + l, 200); 
            limb(cx, 80, cx - 40, 80 - c * 40); 
            limb(cx, 80, cx + 40, 80 - c * 40); 
        } else if(['SQUATS'].includes(type)) { 
            const y = c * 30; 
            limb(cx, 130 + y, cx - 20, 165 + y, cx - 20, 200); 
            limb(cx, 130 + y, cx + 20, 165 + y, cx + 20, 200); 
            limb(cx, 80 + y, cx - 30, 100 + y); 
            limb(cx, 80 + y, cx + 30, 100 + y); 
        } else { 
            const s = Math.sin(t * 5) * 20; 
            limb(cx, 80, cx - 25, 110 + s); 
            limb(cx, 80, cx + 25, 110 - s); 
            limb(cx, 130, cx - 15, 200 - s); 
            limb(cx, 130, cx + 15, 200 + s); 
        }
        demoAnimId = requestAnimationFrame(() => draw(time + 16));
    }
    draw(0);
}

function drawSkeleton(poses) {
    poses.forEach((pose, i) => {
        if(pose.score < 0.3) return;
        const color = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b'][i % 4];
        ctx.strokeStyle = color; 
        ctx.lineWidth = 4;
        const k = pose.keypoints;
        
        // Draw skeleton connections
        [[5,7],[7,9],[6,8],[8,10],[5,6],[5,11],[6,12],[11,13],[13,15],[12,14],[14,16]].forEach(([a,b]) => {
            if(k[a].score > 0.3 && k[b].score > 0.3) { 
                ctx.beginPath(); 
                ctx.moveTo(k[a].x, k[a].y); 
                ctx.lineTo(k[b].x, k[b].y); 
                ctx.stroke(); 
            }
        });
        
        // Draw player labels
        if(k[0].score > 0.3) {
            ctx.save(); 
            ctx.translate(k[0].x, k[0].y - 60); 
            ctx.scale(-1, 1);
            const text = STATE.sessionStats[i] ? STATE.sessionStats[i].name : `P${i+1}`;
            ctx.font = "bold 16px Barlow"; 
            const w = ctx.measureText(text).width + 20;
            ctx.fillStyle = "rgba(15, 23, 42, 0.9)"; 
            ctx.fillRect(-w/2, -20, w, 30);
            ctx.fillStyle = color; 
            ctx.textAlign = "center"; 
            ctx.fillText(text, 0, 0); 
            ctx.restore();
        }
    });
}
