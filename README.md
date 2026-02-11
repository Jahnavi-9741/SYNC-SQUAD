# SYNC SQUAD  
## Tactical AI-Powered Team Fitness Protocol

SYNC SQUAD is a real-time multiplayer AI fitness game built using **TensorFlow.js MoveNet MultiPose**.  
It transforms group workouts into a synchronized tactical mission where multiple players perform exercises together while being tracked through live AI pose detection.

---

##  Authors

- Bukke Suraj Naik  
- Gorantla Jahnavi  
- Contractor Sania  
- Pidatala Naga Karthikeya  

##  Project Objective

To create an immersive AI-powered fitness experience where:

- Multiple players stand in front of a single camera
- AI detects body movements in real time
- Repetitions are automatically counted
- Team synchronization is measured
- Performance analytics are generated at the end

---

##  AI & Machine Learning

### Model Used
- TensorFlow.js
- MoveNet MultiPose Lightning Model
- Bounding Box Tracker Enabled

The system detects multiple players simultaneously and assigns them based on horizontal positioning.

---

##  Exercise Detection System

Each exercise uses keypoint relationships from MoveNet.

Examples:

- **Jumping Jacks** → Wrist height relative to shoulders  
- **Squats** → Hip-to-knee vertical distance  
- **Crunches** → Shoulder-to-knee proximity  
- **High Knees** → Knee above hip line  
- **Boxing** → Wrist crossing nose axis  
- **Toe Touches** → Wrist below hip threshold  

---

##  Rep Counting Logic (State Machine)

Each player follows a controlled repetition cycle:


To prevent false positives:

- Debounce timer applied (default 400ms)
- Reset condition required before next rep
- Pose confidence threshold must be above 0.3

---

## 🎮 Game Flow

### 1️⃣ Lobby Screen
- Select squad size (2–4 players)
- Choose difficulty:
  - RECRUIT (Easy)
  - VETERAN (Medium)
  - ELITE (Hard)
- Enter operative names
- Preview mission phases

### 2️⃣ Game HUD
- Current Phase
- Exercise Name
- Live Timer
- Squad Rep Counter
- Progress Bar
- AI Skeleton Overlay
- Demo Animation Before Each Phase

### 3️⃣ Summary Screen
- Phase timeline with duration
- Individual player contribution %
- Total team reps
- Sync efficiency score

---


This measures how effectively the squad completed mission objectives.

---

## 🔊 Audio System

SYNC SQUAD uses:

- Web Speech API (voice announcements)
- Web Audio API (custom beep & completion tones)

This enhances immersion and engagement.

---

## 🎨 UI & Design System

- Tailwind CSS
- Custom CSS Variables
- Glassmorphism Panels
- Scanline Tactical Overlay
- Full-Screen Immersive Layout
- Camera Mirroring for Natural Movement

---


---

## ⚙️ Configuration System

The application uses:

- `CONFIG` → Game settings (team size, difficulty, resolution, timers)
- `STATE` → Live session state
- `POOLS` → Difficulty-based exercise pools
- `EXERCISE_DB` → Exercise metadata (name, description, time limit)

---

## ▶️ How to Run

### Option 1: Simple Method

1. Download the project
2. Open `index.html` in a modern browser
3. Allow camera access
4. Start the mission

### ⚠️ Important

For full camera access and best compatibility:

- Use **Live Server (VS Code Extension)**
- OR host via HTTPS

---

## 🧪 Requirements

- Modern Browser (Chrome Recommended)
- Webcam
- HTTPS (for camera access)
- Internet connection (for CDN libraries)

---

## 🚀 Features

- Multi-person AI pose detection
- Automatic repetition counting
- Difficulty scaling
- Dynamic mission generation
- Animated demo guidance
- Real-time skeleton overlay
- Individual contribution tracking
- Sync efficiency scoring
- Tactical immersive UI
- Voice + sound feedback

---

## 💡 Technical Highlights

- MoveNet MultiPose Lightning for performance
- Bounding box tracker for stable player assignment
- Real-time canvas rendering
- Modular JavaScript architecture
- Debounced rep detection state machine
- Adaptive mission scaling based on team size

---

## 🔮 Future Improvements

- Cloud leaderboard system
- Remote multiplayer mode
- Session data export
- Mobile optimization
- AI posture correction scoring
- Heart-rate integration
- Voice command controls

---



## 📌 Conclusion

SYNC SQUAD demonstrates how AI can be integrated into real-world fitness applications to create engaging, intelligent, and measurable team workout experiences.

It combines:

- Artificial Intelligence  
- Game Design  
- Real-Time Systems  
- Human-Computer Interaction  
- Performance Analytics  

into a single interactive platform.




