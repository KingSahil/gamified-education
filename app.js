
// Firebase Configuration
const firebaseConfig = {
apiKey: "AIzaSyBAyOtwNplLJZRulPhHyKwcNZzH5nxCEDE",
authDomain: "gamified-education-3a6e3.firebaseapp.com",
projectId: "gamified-education-3a6e3",
storageBucket: "gamified-education-3a6e3.firebasestorage.app",
messagingSenderId: "601559717243",
appId: "1:601559717243:web:76ccc28250674ad0f119de",
measurementId: "G-B6QL469KC1"
};

// Initialize Firebase with error handling
let auth = null;
let db = null;
let googleProvider = null;
let firebaseInitialized = false;

// Check if running on localhost or file protocol
const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const isFileProtocol = location.protocol === 'file:';

if (isFileProtocol) {
    console.warn('⚠️ Running on file:// protocol');
    console.log('🔧 For full Firebase functionality, please use the development server:');
    console.log('   1. Run: python serve.py');
    console.log('   2. Or double-click: start-server.bat');
    console.log('   3. Visit: http://localhost:8000');
}

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    auth = firebase.auth();
    db = firebase.firestore();
    googleProvider = new firebase.auth.GoogleAuthProvider();
    
    // Configure for development
    if (isLocalhost) {
        // Use Firebase emulator if available (optional)
        // auth.useEmulator('http://localhost:9099');
        // db.useEmulator('localhost', 8080);
        console.log('🏠 Running on localhost - Firebase features enabled');
    }
    
    firebaseInitialized = true;
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error.message);
    console.log('📝 App will continue in offline mode');
    firebaseInitialized = false;
}

// Sample Data Store (In production, this would be Firebase)
let currentUser = null;
let isSignUp = false;
let userXP = 0;
let currentCourse = null;
let currentVideo = null;

// Course Data for CSE Semester 1
const courses = [
    {
        code: 'CEL1020',
        title: 'Engineering Mechanics',
        credits: 4,
        videos: 25,
        progress: 45,
        topics: [
            'Statics of Particles',
            'Equilibrium of Rigid Bodies',
            'Structural Analysis',
            'Friction',
            'Kinematics of Particles',
            'Kinetics of Particles',
            'Dynamics of Rigid Bodies',
            'Work and Energy Methods',
            'Impulse and Momentum'
        ]
    },
    {
        code: 'MEL1021',
        title: 'Engineering Graphics & Drafting Using AutoCAD',
        credits: 4,
        videos: 18,
        progress: 30,
        topics: [
            'Introduction to CAD',
            'Basic Drawing Commands',
            'Orthographic Projections',
            'Isometric Drawings',
            'Sectional Views',
            '3D Modeling Basics'
        ]
    },
    {
        code: 'MTL1001',
        title: 'Mathematics-I',
        credits: 4,
        videos: 30,
        progress: 60,
        topics: [
            'Differential Calculus',
            'Integral Calculus',
            'Matrices and Determinants',
            'Vector Calculus',
            'Infinite Series',
            'Differential Equations',
            'Multiple Integrals'
        ]
    },
    {
        code: 'PHL1083',
        title: 'Physics',
        credits: 4,
        videos: 22,
        progress: 25,
        topics: [
            'Mechanics',
            'Waves and Oscillations',
            'Thermodynamics',
            'Electromagnetism',
            'Optics',
            'Modern Physics'
        ]
    },
    {
        code: 'MEL1010',
        title: 'Introduction to Eng. Materials',
        credits: 3,
        videos: 15,
        progress: 70,
        topics: [
            'Crystal Structure',
            'Mechanical Properties',
            'Phase Diagrams',
            'Heat Treatment',
            'Composites',
            'Material Selection'
        ]
    }
];

// User likes tracking
let userLikes = new Set();

// Routing and History Management
const AppRouter = {
    currentRoute: '',
    
    // Initialize routing
    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            if (event.state) {
                this.navigateToState(event.state);
            } else {
                // Default to courses if no state
                this.navigate('courses');
            }
        });
        
        // Load initial route from URL hash or default to courses
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.parseAndNavigate(hash);
        } else {
            this.navigate('courses');
        }
    },
    
    // Parse URL hash and navigate
    parseAndNavigate(hash) {
        const parts = hash.split('/');
        const route = parts[0];
        
        if (route === 'course' && parts[1]) {
            this.navigate('course', { courseCode: parts[1] });
        } else if (route === 'video' && parts[1]) {
            this.navigate('video', { videoId: parseInt(parts[1]) });
        } else if (route === 'battle') {
            this.navigate('battle');
        } else if (route === 'leaderboard') {
            this.navigate('leaderboard');
        } else {
            this.navigate('courses');
        }
    },
    
    // Navigate to a route
    navigate(route, params = {}) {
        const state = { route, params };
        
        // Create URL hash
        let hash = route;
        if (route === 'course' && params.courseCode) {
            hash = `course/${params.courseCode}`;
        } else if (route === 'video' && params.videoId) {
            hash = `video/${params.videoId}`;
        }
        
        // Update browser history
        const url = `#${hash}`;
        if (window.location.hash !== url) {
            history.pushState(state, '', url);
        }
        
        this.currentRoute = route;
        this.navigateToState(state);
    },
    
    // Navigate to state without changing URL
    navigateToState(state) {
        const { route, params } = state;
        
        // Hide all sections first
        this.hideAllSections();
        
        // Update navigation active state
        this.updateNavigation(route);
        
        // Show appropriate section
        switch (route) {
            case 'courses':
                document.getElementById('coursesSection').style.display = 'block';
                loadCourses();
                break;
            case 'course':
                if (params.courseCode) {
                    currentCourse = params.courseCode;
                    showVideos(params.courseCode);
                }
                break;
            case 'video':
                if (params.videoId) {
                    this.openVideoById(params.videoId);
                }
                break;
            case 'battle':
                document.getElementById('battleSection').style.display = 'block';
                break;
            case 'leaderboard':
                document.getElementById('leaderboardSection').style.display = 'block';
                loadLeaderboard();
                break;
            default:
                document.getElementById('coursesSection').style.display = 'block';
                loadCourses();
        }
    },
    
    // Hide all sections
    hideAllSections() {
        document.getElementById('coursesSection').style.display = 'none';
        document.getElementById('videoSection').style.display = 'none';
        document.getElementById('videoPlayerSection').style.display = 'none';
        document.getElementById('battleSection').style.display = 'none';
        document.getElementById('leaderboardSection').style.display = 'none';
    },
    
    // Update navigation active state
    updateNavigation(route) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            const section = item.getAttribute('data-section');
            if ((route === 'courses' && section === 'courses') ||
                (route === 'course' && section === 'courses') ||
                (route === 'video' && section === 'courses') ||
                (route === 'battle' && section === 'battle') ||
                (route === 'leaderboard' && section === 'leaderboard')) {
                item.classList.add('active');
            }
        });
    },
    
    // Open video by ID
    openVideoById(videoId) {
        let video = null;
        let courseCode = null;
        
        // Find video across all courses
        for (const [code, courseVideos] of Object.entries(videosData)) {
            video = courseVideos.find(v => v.id === videoId);
            if (video) {
                courseCode = code;
                break;
            }
        }
        
        if (video && courseCode) {
            currentCourse = courseCode;
            showVideoPlayer(video);
        } else {
            // Video not found, go to courses
            this.navigate('courses');
        }
    }
};

// Track comment XP per video per user
let userVideoCommentXP = new Set(); // Format: `${userId}_${videoId}`

// Sample Videos Data with real educational videos
const videosData = {
    'CEL1020': [
        {
            id: 1,
            title: 'Introduction to Statics - Forces and Equilibrium',
            topic: 'Statics of Particles',
            url: 'https://www.youtube.com/watch?v=Oh4m8Ees-3Q',
            upvotes: 45,
            views: 230,
            comments: 12,
            xpReward: 50,
            duration: '15:30',
            difficulty: 'Beginner',
            addedBy: 'Prof. Sharma'
        },
        {
            id: 2,
            title: 'Equilibrium of Particles - Problem Solving Techniques',
            topic: 'Statics of Particles',
            url: 'https://www.youtube.com/watch?v=mubU-D5QdHU',
            upvotes: 32,
            views: 180,
            comments: 8,
            xpReward: 50,
            duration: '20:45',
            difficulty: 'Intermediate',
            addedBy: 'Student_Rahul'
        },
        {
            id: 10,
            title: 'Moments and Couples in Mechanics',
            topic: 'Equilibrium of Rigid Bodies',
            url: 'https://www.youtube.com/watch?v=N6X8dWYAH8E',
            upvotes: 28,
            views: 165,
            comments: 6,
            xpReward: 60,
            duration: '18:20',
            difficulty: 'Intermediate',
            addedBy: 'Dr. Patel'
        },
        {
            id: 11,
            title: 'Friction Problems - Static and Kinetic Friction',
            topic: 'Friction',
            url: 'https://www.youtube.com/watch?v=fo_pmp5rtzo',
            upvotes: 41,
            views: 290,
            comments: 15,
            xpReward: 55,
            duration: '25:10',
            difficulty: 'Advanced',
            addedBy: 'Student_Priya'
        }
    ],
    'MTL1001': [
        {
            id: 3,
            title: 'Limits and Continuity - Calculus Fundamentals',
            topic: 'Differential Calculus',
            url: 'https://www.youtube.com/watch?v=riXcZT2ICjA',
            upvotes: 67,
            views: 450,
            comments: 23,
            xpReward: 50,
            duration: '30:15',
            difficulty: 'Beginner',
            addedBy: 'Prof. Kumar'
        },
        {
            id: 4,
            title: 'Derivative Rules and Techniques',
            topic: 'Differential Calculus',
            url: 'https://www.youtube.com/watch?v=S0_qX4VJhMQ',
            upvotes: 52,
            views: 320,
            comments: 18,
            xpReward: 55,
            duration: '22:40',
            difficulty: 'Intermediate',
            addedBy: 'Student_Amit'
        },
        {
            id: 5,
            title: 'Matrix Operations and Linear Algebra',
            topic: 'Matrices and Determinants',
            url: 'https://www.youtube.com/watch?v=XkY2DOUCWMU',
            upvotes: 38,
            views: 275,
            comments: 14,
            xpReward: 45,
            duration: '19:25',
            difficulty: 'Beginner',
            addedBy: 'Dr. Singh'
        }
    ],
    'PHL1083': [
        {
            id: 6,
            title: 'Newton\'s Laws of Motion - Classical Mechanics',
            topic: 'Mechanics',
            url: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
            upvotes: 73,
            views: 520,
            comments: 31,
            xpReward: 50,
            duration: '28:10',
            difficulty: 'Beginner',
            addedBy: 'Prof. Verma'
        },
        {
            id: 7,
            title: 'Wave Properties and Interference Patterns',
            topic: 'Waves and Oscillations',
            url: 'https://www.youtube.com/watch?v=DovunOxlY1k',
            upvotes: 45,
            views: 310,
            comments: 19,
            xpReward: 60,
            duration: '24:35',
            difficulty: 'Intermediate',
            addedBy: 'Student_Sneha'
        }
    ],
    'MEL1021': [
        {
            id: 8,
            title: 'AutoCAD Basic Commands and Tools',
            topic: 'Basic Drawing Commands',
            url: 'https://www.youtube.com/watch?v=QnHe4iMDLWs',
            upvotes: 56,
            views: 380,
            comments: 22,
            xpReward: 45,
            duration: '35:20',
            difficulty: 'Beginner',
            addedBy: 'Prof. Gupta'
        }
    ],
    'MEL1010': [
        {
            id: 9,
            title: 'Crystal Structure and Material Properties',
            topic: 'Crystal Structure',
            url: 'https://www.youtube.com/watch?v=HSTic_r5NDI',
            upvotes: 34,
            views: 195,
            comments: 11,
            xpReward: 55,
            duration: '21:45',
            difficulty: 'Intermediate',
            addedBy: 'Dr. Rao'
        }
    ]
};

// Sample Leaderboard Data
const leaderboardData = [
    { name: 'Rahul Sharma', branch: 'CSE', xp: 2450 },
    { name: 'Priya Patel', branch: 'CSE', xp: 2200 },
    { name: 'Amit Kumar', branch: 'ECE', xp: 1980 },
    { name: 'Sneha Singh', branch: 'CSE', xp: 1750 },
    { name: 'Arjun Verma', branch: 'ME', xp: 1600 }
];

// Authentication Functions
function signInWithGoogle() {
    if (!firebaseInitialized || !auth) {
        if (isFileProtocol) {
            showToast('Please use development server for Google Sign-in (run start-server.bat)', 'warning');
        } else {
            showToast('Firebase not available. Using demo login instead.', 'warning');
        }
        // Simulate successful Google login
        handleAuthSuccess({
            email: 'demo@example.com',
            fullName: 'Demo Student',
            photoURL: null,
            uid: 'demo-user',
            branch: 'CSE',
            semester: '1',
            xp: 250
        });
        return;
    }
    
    auth.signInWithPopup(googleProvider)
        .then((result) => {
            const user = result.user;
            handleAuthSuccess({
                email: user.email,
                fullName: user.displayName,
                photoURL: user.photoURL,
                uid: user.uid,
                branch: 'CSE', // Default, user can update later
                semester: '1',
                xp: 0
            });
        })
        .catch((error) => {
            console.error('Google sign-in error:', error);
            
            if (error.code === 'auth/unauthorized-domain') {
                showToast('Domain not authorized. Please add localhost to Firebase authorized domains.', 'error');
            } else if (error.code === 'auth/popup-blocked') {
                showToast('Popup blocked. Please allow popups and try again.', 'warning');
            } else {
                showToast('Google sign-in failed. Using demo mode.', 'warning');
            }
            
            // Fallback to demo login
            handleAuthSuccess({
                email: 'demo@example.com',
                fullName: 'Demo Student',
                photoURL: null,
                uid: 'demo-user',
                branch: 'CSE',
                semester: '1',
                xp: 250
            });
        });
}

function signUpWithEmail(email, password, userData) {
    if (!firebaseInitialized || !auth) {
        showToast('Firebase not available. Creating demo account.', 'warning');
        // Simulate successful signup
        currentUser = {
            email: email,
            fullName: userData.fullName,
            branch: userData.branch,
            semester: userData.semester,
            uid: 'demo-' + Date.now(),
            xp: 0
        };
        handleAuthSuccess(currentUser);
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            return db.collection('users').doc(user.uid).set({
                email: user.email,
                fullName: userData.fullName,
                branch: userData.branch,
                semester: userData.semester,
                xp: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            showToast('Account created successfully!', 'success');
        })
        .catch((error) => {
            console.error('Sign up error:', error);
            showToast('Sign up failed. Creating demo account.', 'warning');
            // Fallback to demo account
            currentUser = {
                email: email,
                fullName: userData.fullName,
                branch: userData.branch,
                semester: userData.semester,
                uid: 'demo-' + Date.now(),
                xp: 0
            };
            handleAuthSuccess(currentUser);
        });
}

function signInWithEmail(email, password) {
    if (!firebaseInitialized || !auth) {
        showToast('Firebase not available. Using demo login.', 'warning');
        // Simulate successful login
        handleAuthSuccess({
            email: email,
            fullName: 'Demo Student',
            photoURL: null,
            uid: 'demo-user',
            branch: 'CSE',
            semester: '1',
            xp: 250
        });
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // User will be handled by auth state observer
        })
        .catch((error) => {
            console.error('Sign in error:', error);
            showToast('Sign in failed. Using demo mode.', 'warning');
            // Fallback to demo login
            handleAuthSuccess({
                email: email,
                fullName: 'Demo Student',
                photoURL: null,
                uid: 'demo-user',
                branch: 'CSE',
                semester: '1',
                xp: 250
            });
        });
}

function handleAuthSuccess(userData) {
    currentUser = userData;
    userXP = userData.xp || 0;
    
    // Show dashboard
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    // Update user info
    if (userData.photoURL) {
        const avatar = document.getElementById('userAvatar');
        avatar.innerHTML = `<img src="${userData.photoURL}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
        document.getElementById('userAvatar').textContent = userData.fullName[0].toUpperCase();
    }
    document.getElementById('userXP').textContent = userXP;
    
    // Load content
    loadCourses();
    loadLeaderboard();
    
    // Initialize routing
    AppRouter.init();
    
    // Show app status
    const statusMessage = firebaseInitialized ? 
        `Welcome back, ${userData.fullName}! 🔥 All features enabled` :
        `Welcome ${userData.fullName}! 📝 Running in offline mode`;
    
    showToast(statusMessage, firebaseInitialized ? 'success' : 'warning');
}

// Auth state observer
if (firebaseInitialized && auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in, get additional data from Firestore
            if (db) {
                db.collection('users').doc(user.uid).get()
                    .then((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            handleAuthSuccess({
                                email: user.email,
                                fullName: userData.fullName || user.displayName,
                                photoURL: user.photoURL,
                                uid: user.uid,
                                branch: userData.branch || 'CSE',
                                semester: userData.semester || '1',
                                xp: userData.xp || 0
                            });
                        } else {
                            // User exists in Auth but not in Firestore (Google sign-in)
                            handleAuthSuccess({
                                email: user.email,
                                fullName: user.displayName || 'Student',
                                photoURL: user.photoURL,
                                uid: user.uid,
                                branch: 'CSE',
                                semester: '1',
                                xp: 0
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error getting user data:', error);
                    });
            }
        } else {
            // User is signed out
            currentUser = null;
            document.getElementById('authSection').style.display = 'flex';
            document.getElementById('dashboardSection').style.display = 'none';
        }
    });
} else {
    console.log('📝 Firebase auth observer not initialized - app will work in offline mode');
}

function signOut() {
    if (firebaseInitialized && auth) {
        auth.signOut().then(() => {
            showToast('Signed out successfully', 'success');
        }).catch((error) => {
            showToast('Sign out error: ' + error.message, 'error');
        });
    } else {
        // Local signout
        currentUser = null;
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('dashboardSection').style.display = 'none';
        showToast('Signed out successfully', 'success');
    }
}
// Authentication Toggle
document.getElementById('authToggle').addEventListener('click', (e) => {
    e.preventDefault();
    isSignUp = !isSignUp;
    
    const signupFields = document.getElementById('signupFields');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleText = document.getElementById('authToggleText');
    const toggleLink = document.getElementById('authToggle');
    
    if (isSignUp) {
        signupFields.style.display = 'block';
        submitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account?';
        toggleLink.textContent = 'Sign In';
    } else {
        signupFields.style.display = 'none';
        submitBtn.textContent = 'Sign In';
        toggleText.textContent = "Don't have an account?";
        toggleLink.textContent = 'Sign Up';
    }
});

// Google Sign In Button
document.querySelector('.btn-google').addEventListener('click', (e) => {
    e.preventDefault();
    signInWithGoogle();
});

// Form Submission
document.getElementById('authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (isSignUp) {
        const fullName = document.getElementById('fullName').value;
        const branch = document.getElementById('branch').value;
        const semester = document.getElementById('semester').value;
        
        if (!fullName || !branch || !semester) {
            showToast('Please fill all fields', 'error');
            return;
        }
        
        signUpWithEmail(email, password, {
            fullName,
            branch,
            semester
        });
    } else {
        signInWithEmail(email, password);
    }
});

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const section = this.getAttribute('data-section');
        
        if (section === 'courses') {
            AppRouter.navigate('courses');
        } else if (section === 'battle') {
            AppRouter.navigate('battle');
        } else if (section === 'leaderboard') {
            AppRouter.navigate('leaderboard');
        }
    });
});

// Load Courses
function loadCourses() {
    const courseGrid = document.getElementById('courseGrid');
    courseGrid.innerHTML = '';
    
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.onclick = () => AppRouter.navigate('course', { courseCode: course.code });
        
        courseCard.innerHTML = `
            <div class="course-header">
                <div class="course-code">${course.code}</div>
                <div class="course-title">${course.title}</div>
            </div>
            <div class="course-body">
                <div class="course-stats">
                    <div class="stat-item">
                        <div class="stat-value">${course.videos}</div>
                        <div class="stat-label">Videos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${course.credits}</div>
                        <div class="stat-label">Credits</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${course.progress}%</div>
                        <div class="stat-label">Complete</div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${course.progress}%"></div>
                </div>
                <div class="progress-text">Keep going! You're doing great 💪</div>
            </div>
        `;
        
        courseGrid.appendChild(courseCard);
    });
}

// Show Videos for a Course
function showVideos(courseCode) {
    currentCourse = courseCode;
    const course = courses.find(c => c.code === courseCode);
    
    document.getElementById('coursesSection').style.display = 'none';
    document.getElementById('videoSection').style.display = 'block';
    document.getElementById('videoSectionTitle').textContent = `${course.title} - Videos`;
    
    const videoGrid = document.getElementById('videoGrid');
    videoGrid.innerHTML = '';
    
    const videos = videosData[courseCode] || [];
    
    if (videos.length === 0) {
        videoGrid.innerHTML = '<p style="text-align: center; color: #64748b;">No videos added yet. Be the first to add one!</p>';
        return;
    }
    
    // Group videos by topic
    const videosByTopic = {};
    videos.forEach(video => {
        if (!videosByTopic[video.topic]) {
            videosByTopic[video.topic] = [];
        }
        videosByTopic[video.topic].push(video);
    });
    
    // Display videos grouped by topics
    Object.keys(videosByTopic).forEach(topic => {
        // Topic header
        const topicHeader = document.createElement('div');
        topicHeader.innerHTML = `
            <h3 style="margin: 30px 0 15px 0; color: var(--primary); border-bottom: 2px solid var(--border); padding-bottom: 10px;">
                📚 ${topic}
            </h3>
        `;
        videoGrid.appendChild(topicHeader);
        
        // Videos in this topic
        videosByTopic[topic].forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            
            const isLiked = userLikes.has(video.id);
            const difficultyColor = video.difficulty === 'Beginner' ? '#10b981' : 
                                    video.difficulty === 'Intermediate' ? '#f59e0b' : '#ef4444';
            
            videoCard.innerHTML = `
                <div class="video-thumbnail" onclick="watchVideo(${video.id})" style="cursor: pointer;">
                    <div class="play-icon">▶</div>
                    <div style="position: absolute; top: 8px; right: 8px; background: ${difficultyColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">
                        ${video.difficulty}
                    </div>
                    <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">
                        ${video.duration}
                    </div>
                </div>
                <div class="video-info">
                    <div class="video-title" onclick="watchVideo(${video.id})" style="cursor: pointer;">${video.title}</div>
                    <div class="video-meta">
                        <span class="meta-item">👁 ${video.views} views</span>
                        <span class="meta-item">💬 ${video.comments} comments</span>
                        <span class="meta-item">⚡ ${video.xpReward} XP</span>
                        <span class="meta-item">👤 ${video.addedBy}</span>
                    </div>
                    <div class="vote-section">
                        <button class="vote-btn ${isLiked ? 'active' : ''}" onclick="toggleLike(${video.id})" id="like-btn-${video.id}">
                            ${isLiked ? '❤️' : '🤍'} <span id="like-count-${video.id}">${video.upvotes}</span>
                        </button>
                        <button class="btn btn-primary" style="width: auto;" onclick="watchVideo(${video.id})">
                            🎥 Watch & Earn XP
                        </button>
                        <button class="vote-btn" onclick="shareVideo(${video.id})">
                            📤 Share
                        </button>
                    </div>
                </div>
            `;
            
            videoGrid.appendChild(videoCard);
        });
    });
    
    // Load comments
    loadComments();
}

// Show Courses
function showCourses() {
    AppRouter.navigate('courses');
}

// Go to Homepage (when clicking logo)
function goToHomepage() {
    AppRouter.navigate('courses');
}

// Watch Video - Now shows embedded player instead of redirect
function watchVideo(videoId) {
    // Find video across all courses
    let video = null;
    for (const courseVideos of Object.values(videosData)) {
        video = courseVideos.find(v => v.id === videoId);
        if (video) break;
    }
    
    if (video) {
        // Increase view count
        video.views++;
        
        // Navigate to video page
        AppRouter.navigate('video', { videoId: videoId });
        
        // Add XP
        updateUserXP(video.xpReward, `Watched: ${video.title}`);
        
        // Show success message
        showToast(`🎉 You earned ${video.xpReward} XP! Keep learning!`, 'success');
    }
}

// Global variable to store current playing video
let currentPlayingVideo = null;

// Show Video Player with embedded YouTube video
function showVideoPlayer(video) {
    currentPlayingVideo = video;
    
    // Hide video list and show player
    document.getElementById('videoSection').style.display = 'none';
    document.getElementById('videoPlayerSection').style.display = 'block';
    
    // Update video player title
    document.getElementById('videoPlayerTitle').textContent = video.title;
    
    // Embed YouTube video
    const videoEmbed = document.getElementById('videoEmbed');
    const videoId = extractYouTubeVideoId(video.url);
    
    if (videoId) {
        videoEmbed.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    } else {
        videoEmbed.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f1f5f9; color: #64748b; font-size: 1.1rem;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📺</div>
                    <p>Unable to load video</p>
                    <a href="${video.url}" target="_blank" style="color: var(--primary); text-decoration: none;">Watch on YouTube</a>
                </div>
            </div>
        `;
    }
    
    // Update video information
    document.getElementById('currentVideoTitle').textContent = video.title;
    document.getElementById('currentVideoTopic').textContent = `📚 ${video.topic}`;
    document.getElementById('currentVideoDuration').textContent = `⏱️ ${video.duration}`;
    document.getElementById('currentVideoDifficulty').textContent = `🎯 ${video.difficulty}`;
    document.getElementById('currentVideoAddedBy').textContent = `👤 ${video.addedBy}`;
    document.getElementById('currentVideoXP').textContent = video.xpReward;
    
    // Update like button
    const isLiked = userLikes.has(video.id);
    const likeBtn = document.getElementById('currentVideoLikeBtn');
    likeBtn.innerHTML = `${isLiked ? '❤️' : '🤍'} <span id="currentVideoLikes">${video.upvotes}</span>`;
    likeBtn.className = `video-action-btn ${isLiked ? 'active' : ''}`;
    
    // Load comments for this video
    loadVideoComments(video.id);
}

// Extract YouTube Video ID from URL
function extractYouTubeVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// Back to Video List
function backToVideoList() {
    if (currentCourse) {
        AppRouter.navigate('course', { courseCode: currentCourse });
    } else {
        AppRouter.navigate('courses');
    }
    currentPlayingVideo = null;
}

// Like Current Video
function likeCurrentVideo() {
    if (!currentPlayingVideo) return;
    
    const videoId = currentPlayingVideo.id;
    const likeBtn = document.getElementById('currentVideoLikeBtn');
    const likeCount = document.getElementById('currentVideoLikes');
    
    if (userLikes.has(videoId)) {
        // User already liked, so unlike
        userLikes.delete(videoId);
        currentPlayingVideo.upvotes--;
        likeBtn.classList.remove('active');
        likeBtn.innerHTML = `🤍 <span id="currentVideoLikes">${currentPlayingVideo.upvotes}</span>`;
        showToast('Like removed', 'warning');
    } else {
        // User hasn't liked, so like
        userLikes.add(videoId);
        currentPlayingVideo.upvotes++;
        likeBtn.classList.add('active');
        likeBtn.innerHTML = `❤️ <span id="currentVideoLikes">${currentPlayingVideo.upvotes}</span>`;
        showToast('Liked! +5 XP', 'success');
        
        // Award XP for engagement
        updateUserXP(5, 'Video like');
    }
}

// Share Current Video
function shareCurrentVideo() {
    if (!currentPlayingVideo) return;
    
    const shareUrl = `${window.location.origin}#video-${currentPlayingVideo.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Video link copied to clipboard!', 'success');
        
        // Award XP for sharing
        updateUserXP(10, 'Video share');
    }).catch(() => {
        // Fallback for older browsers
        showToast('Share: ' + currentPlayingVideo.title, 'success');
        updateUserXP(10, 'Video share');
    });
}

// Toggle Like (Fixed functionality)
function toggleLike(videoId) {
    // Find video across all courses
    let video = null;
    for (const courseVideos of Object.values(videosData)) {
        video = courseVideos.find(v => v.id === videoId);
        if (video) break;
    }
    
    if (video) {
        const likeBtn = document.getElementById(`like-btn-${videoId}`);
        const likeCount = document.getElementById(`like-count-${videoId}`);
        
        if (userLikes.has(videoId)) {
            // User already liked, so unlike
            userLikes.delete(videoId);
            video.upvotes--;
            likeBtn.classList.remove('active');
            likeBtn.innerHTML = `🤍 <span id="like-count-${videoId}">${video.upvotes}</span>`;
            showToast('Like removed', 'warning');
        } else {
            // User hasn't liked, so like
            userLikes.add(videoId);
            video.upvotes++;
            likeBtn.classList.add('active');
            likeBtn.innerHTML = `❤️ <span id="like-count-${videoId}">${video.upvotes}</span>`;
            showToast('Liked! +5 XP', 'success');
            
            // Award XP for engagement
            updateUserXP(5, 'Video like');
        }
    }
}

// Share Video
function shareVideo(videoId) {
    // Find video across all courses
    let video = null;
    for (const courseVideos of Object.values(videosData)) {
        video = courseVideos.find(v => v.id === videoId);
        if (video) break;
    }
    
    if (video) {
        // Copy video link to clipboard (simplified)
        const shareUrl = `${window.location.origin}#video-${videoId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('Video link copied to clipboard!', 'success');
            
            // Award XP for sharing
            updateUserXP(10, 'Video share');
        }).catch(() => {
            // Fallback for older browsers
            showToast('Share: ' + video.title, 'success');
            updateUserXP(10, 'Video share');
        });
    }
}

// Enhanced Comments System
let commentsData = {
    global: [
        {
            id: 1,
            author: 'Rahul S.',
            avatar: 'R',
            text: 'Great explanation! This really helped me understand the concept.',
            time: '2 hours ago',
            likes: 12,
            replies: [
                {
                    id: 11,
                    author: 'Priya P.',
                    avatar: 'P',
                    text: 'I agree! The examples were perfect.',
                    time: '1 hour ago',
                    likes: 3
                }
            ]
        },
        {
            id: 2,
            author: 'Priya P.',
            avatar: 'P',
            text: 'Can someone explain the part at 10:35? I\'m a bit confused. \ud83e\udd14',
            time: '5 hours ago',
            likes: 5,
            replies: []
        },
        {
            id: 3,
            author: 'Amit K.',
            avatar: 'A',
            text: 'Thanks for sharing! The examples were really helpful. \ud83d\udcaa',
            time: '1 day ago',
            likes: 8,
            replies: []
        }
    ]
};

let userCommentLikes = new Set();
let currentVideoComments = 'global'; // Current video ID or 'global'

// Load Comments for specific video
function loadVideoComments(videoId) {
    currentVideoComments = videoId;
    
    // Initialize video comments if not exist
    if (!commentsData[videoId]) {
        commentsData[videoId] = [];
    }
    
    loadComments();
}

// Load Comments
function loadComments() {
    const commentsContainer = document.getElementById('commentsContainer');
    commentsContainer.innerHTML = '';
    
    const comments = commentsData[currentVideoComments] || [];
    
    if (comments.length === 0) {
        commentsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <div style="font-size: 3rem; margin-bottom: 10px;">💬</div>
                <p>No comments yet. Be the first to start the discussion!</p>
            </div>
        `;
        return;
    }
    
    comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.id = `comment-${comment.id}`;
        
        const isLiked = userCommentLikes.has(comment.id);
        
        commentDiv.innerHTML = `
            <div class="comment-avatar">${comment.avatar}</div>
            <div class="comment-content">
                <div class="comment-author">${comment.author}</div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-meta">
                    <span class="comment-like ${isLiked ? 'liked' : ''}" onclick="toggleCommentLike(${comment.id})">
                        ${isLiked ? '❤️' : '🤍'} <span id="comment-likes-${comment.id}">${comment.likes}</span>
                    </span>
                    <span>${comment.time}</span>
                    <span style="cursor: pointer; color: var(--primary);" onclick="showReplyBox(${comment.id})">💬 Reply</span>
                </div>
                <div class="replies" id="replies-${comment.id}">
                    ${comment.replies.map(reply => `
                        <div class="reply">
                            <div class="comment-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">${reply.avatar}</div>
                            <div class="comment-content">
                                <div class="comment-author">${reply.author}</div>
                                <div class="comment-text">${reply.text}</div>
                                <div class="comment-meta">
                                    <span>🤍 ${reply.likes}</span>
                                    <span>${reply.time}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="reply-box" id="reply-box-${comment.id}" style="display: none; margin-top: 10px;">
                    <div style="display: flex; gap: 10px;">
                        <input type="text" placeholder="Write a reply..." class="reply-input" style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: 8px;" onkeypress="handleReplyKeyPress(event, ${comment.id})">
                        <button onclick="addReply(${comment.id})" class="btn btn-primary" style="padding: 8px 16px; width: auto;">Reply</button>
                    </div>
                </div>
            </div>
        `;
        
        commentsContainer.appendChild(commentDiv);
    });
}

// Enhanced comment functionality
function toggleCommentLike(commentId) {
    const comments = commentsData[currentVideoComments] || [];
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    const likeElement = document.querySelector(`#comment-likes-${commentId}`);
    const likeBtn = likeElement.parentElement;
    
    if (userCommentLikes.has(commentId)) {
        userCommentLikes.delete(commentId);
        comment.likes--;
        likeBtn.classList.remove('liked');
        likeBtn.innerHTML = `🤍 <span id="comment-likes-${commentId}">${comment.likes}</span>`;
    } else {
        userCommentLikes.add(commentId);
        comment.likes++;
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = `❤️ <span id="comment-likes-${commentId}">${comment.likes}</span>`;
        
        // Award XP for engagement
        updateUserXP(2, 'Comment like');
    }
}

function showReplyBox(commentId) {
    const replyBox = document.getElementById(`reply-box-${commentId}`);
    replyBox.style.display = replyBox.style.display === 'none' ? 'block' : 'none';
}

function addReply(commentId) {
    const replyBox = document.getElementById(`reply-box-${commentId}`);
    const input = replyBox.querySelector('.reply-input');
    const text = input.value.trim();
    
    if (!text) {
        showToast('Please enter a reply', 'warning');
        return;
    }
    
    const comments = commentsData[currentVideoComments] || [];
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    const newReply = {
        id: Date.now(),
        author: currentUser.fullName,
        avatar: currentUser.fullName[0],
        text: text,
        time: 'Just now',
        likes: 0
    };
    
    comment.replies.push(newReply);
    input.value = '';
    replyBox.style.display = 'none';
    
    // Reload comments to show new reply
    loadComments();
    
    // Award XP for participation
    updateUserXP(15, 'Comment reply');
    showToast('Reply posted! +15 XP', 'success');
}

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function showProfile() {
    showToast('Profile feature coming soon!', 'warning');
    toggleUserMenu();
}

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    const userProfile = document.querySelector('.user-profile');
    const userMenu = document.getElementById('userMenu');
    if (userMenu && !userProfile.contains(e.target)) {
        userMenu.style.display = 'none';
    }
});
// Handle Enter key press in comment input
function handleCommentKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addComment();
    }
}

// Handle Enter key press in reply input
function handleReplyKeyPress(event, commentId) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addReply(commentId);
    }
}

function addComment() {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    
    if (!text) {
        showToast('Please enter a comment', 'warning');
        return;
    }
    
    const newComment = {
        id: Date.now(),
        author: currentUser.fullName,
        avatar: currentUser.fullName[0],
        text: text,
        time: 'Just now',
        likes: 0,
        replies: []
    };
    
    // Add comment to appropriate video or global
    if (currentVideoComments === 'global') {
        commentsData.global.unshift(newComment);
    } else {
        if (!commentsData[currentVideoComments]) {
            commentsData[currentVideoComments] = [];
        }
        commentsData[currentVideoComments].unshift(newComment);
    }
    
    input.value = '';
    
    // Reload comments
    loadComments();
    
    // Award XP for participation (only once per video per user)
    const userId = currentUser.uid || currentUser.email;
    const xpKey = `${userId}_${currentVideoComments}`;
    
    if (!userVideoCommentXP.has(xpKey)) {
        userVideoCommentXP.add(xpKey);
        updateUserXP(10, 'Comment posted');
        showToast('Comment posted! +10 XP', 'success');
    } else {
        showToast('Comment posted!', 'success');
    }
}

// Enhanced XP System with Achievements
function updateUserXP(amount, reason) {
    const oldLevel = Math.floor(userXP / 1000);
    userXP += amount;
    const newLevel = Math.floor(userXP / 1000);
    
    document.getElementById('userXP').textContent = userXP;
    
    // Check for level up
    if (newLevel > oldLevel) {
        showLevelUpAnimation(newLevel);
    }
    
    // Save to Firebase if user is authenticated and Firebase is available
    if (firebaseInitialized && currentUser && currentUser.uid && db) {
        db.collection('users').doc(currentUser.uid).update({
            xp: userXP
        }).catch(error => {
            console.log('XP save error (will continue offline):', error.message);
        });
    }
    
    // Check for achievements
    checkAchievements();
}

function showLevelUpAnimation(level) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 2000; animation: fadeIn 0.3s;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 20px; text-align: center; animation: bounceIn 0.5s;">
            <div style="font-size: 4rem; margin-bottom: 20px;">🎆</div>
            <h2 style="color: var(--primary); margin-bottom: 10px;">Level Up!</h2>
            <p style="color: #64748b; margin-bottom: 20px;">You've reached Level ${level}!</p>
            <p style="background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 10px 20px; border-radius: 12px; font-weight: bold;">
                🎁 Bonus: 100 XP + New Rewards Unlocked!
            </p>
            <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary" style="margin-top: 20px;">
                Awesome!
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (modal.parentElement) {
            modal.remove();
        }
    }, 5000);
    
    // Add bonus XP for leveling up
    userXP += 100;
    document.getElementById('userXP').textContent = userXP;
}

function checkAchievements() {
    // Simple achievement system
    const achievements = [
        { name: 'First Steps', requirement: 100, message: 'Earned your first 100 XP!' },
        { name: 'Learning Enthusiast', requirement: 500, message: 'Reached 500 XP!' },
        { name: 'Knowledge Seeker', requirement: 1000, message: 'Reached 1000 XP!' },
        { name: 'Academic Star', requirement: 2000, message: 'Reached 2000 XP!' }
    ];
    
    achievements.forEach(achievement => {
        if (userXP >= achievement.requirement && !localStorage.getItem(`achievement_${achievement.name}`)) {
            localStorage.setItem(`achievement_${achievement.name}`, 'true');
            showToast(`🏆 Achievement Unlocked: ${achievement.name} - ${achievement.message}`, 'success');
        }
    });
}
// Show Add Video Modal
function showAddVideoModal() {
    document.getElementById('addVideoModal').style.display = 'flex';
    
    // Automatically populate topics based on current course
    if (currentCourse) {
        const contextInfo = document.getElementById('courseContextInfo');
        const contextName = document.getElementById('contextCourseName');
        const topicSelect = document.getElementById('videoTopic');
        
        // Show course context
        const course = courses.find(c => c.code === currentCourse);
        if (course) {
            contextName.textContent = `${course.code} - ${course.title}`;
            contextInfo.style.display = 'block';
            
            // Populate topics for current course
            topicSelect.innerHTML = '<option value="">Choose a topic</option>';
            course.topics.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic;
                option.textContent = topic;
                topicSelect.appendChild(option);
            });
        }
    } else {
        document.getElementById('courseContextInfo').style.display = 'none';
        document.getElementById('videoTopic').innerHTML = '<option value="">No course selected</option>';
    }
}

// Close Modal
function closeModal() {
    document.getElementById('addVideoModal').style.display = 'none';
}

// Close Quiz Modal
function closeQuizModal() {
    document.getElementById('quizModal').style.display = 'none';
}

// Add Video Form Submission
document.getElementById('addVideoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const course = currentCourse; // Use current course context
    const topic = document.getElementById('videoTopic').value;
    const title = document.getElementById('videoTitle').value;
    const url = document.getElementById('videoUrl').value;
    const description = document.getElementById('videoDescription').value;
    
    if (!course) {
        showToast('Please navigate to a specific course to add videos', 'error');
        return;
    }
    
    if (!topic) {
        showToast('Please select a topic', 'error');
        return;
    }
    
    // Validate YouTube URL
    if (!url.includes('youtube.com/watch') && !url.includes('youtu.be/')) {
        showToast('Please enter a valid YouTube URL', 'error');
        return;
    }
    
    // Add video to data (in production, this would be saved to Firebase)
    if (!videosData[course]) {
        videosData[course] = [];
    }
    
    const newVideo = {
        id: Date.now(),
        title,
        topic,
        url,
        description,
        upvotes: 0,
        views: 0,
        comments: 0,
        xpReward: 50,
        duration: '15:00', // Default duration
        difficulty: 'Beginner',
        addedBy: currentUser.fullName
    };
    
    videosData[course].push(newVideo);
    
    // Save to Firebase if authenticated
    if (firebaseInitialized && currentUser && currentUser.uid && db) {
        db.collection('videos').add({
            ...newVideo,
            courseCode: course,
            addedBy: currentUser.uid,
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
            console.log('Video save error (will continue offline):', error.message);
        });
    }
    
    // Award XP for contributing
    updateUserXP(100, 'Video contribution');
    
    closeModal();
    showToast('Video added successfully! +100 XP for contributing!', 'success');
    
    // Reset form
    document.getElementById('addVideoForm').reset();
    document.getElementById('videoTopic').innerHTML = '<option value="">Choose a topic</option>';
    
    // Repopulate topics for current course
    if (currentCourse) {
        const course = courses.find(c => c.code === currentCourse);
        if (course && course.topics) {
            course.topics.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic;
                option.textContent = topic;
                document.getElementById('videoTopic').appendChild(option);
            });
        }
    }
});

// Enhanced Quiz System
const quizQuestions = {
    'Engineering Mechanics': [
        {
            question: 'What is the SI unit of force?',
            options: ['Joule', 'Newton', 'Watt', 'Pascal'],
            correct: 1,
            difficulty: 'easy',
            points: 50
        },
        {
            question: 'Which of the following is a vector quantity?',
            options: ['Speed', 'Mass', 'Velocity', 'Temperature'],
            correct: 2,
            difficulty: 'easy',
            points: 50
        },
        {
            question: 'The moment of a force about a point is the product of:',
            options: ['Force and time', 'Force and perpendicular distance', 'Mass and acceleration', 'Force and velocity'],
            correct: 1,
            difficulty: 'medium',
            points: 75
        },
        {
            question: 'In static equilibrium, the sum of forces is:',
            options: ['Maximum', 'Minimum', 'Zero', 'Infinite'],
            correct: 2,
            difficulty: 'medium',
            points: 75
        },
        {
            question: 'The coefficient of static friction is always:',
            options: ['Less than kinetic friction', 'Greater than kinetic friction', 'Equal to kinetic friction', 'Zero'],
            correct: 1,
            difficulty: 'hard',
            points: 100
        }
    ],
    'Mathematics-I': [
        {
            question: 'What is the derivative of sin(x)?',
            options: ['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'],
            correct: 0,
            difficulty: 'easy',
            points: 50
        },
        {
            question: 'The integral of 1/x dx is:',
            options: ['ln(x) + C', 'x + C', '1/x² + C', 'e^x + C'],
            correct: 0,
            difficulty: 'medium',
            points: 75
        },
        {
            question: 'What is the limit of (sin x)/x as x approaches 0?',
            options: ['0', '1', '∞', 'undefined'],
            correct: 1,
            difficulty: 'hard',
            points: 100
        }
    ],
    'Physics': [
        {
            question: 'The acceleration due to gravity on Earth is approximately:',
            options: ['9.8 m/s', '9.8 m/s²', '9.8 kg/m³', '9.8 N'],
            correct: 1,
            difficulty: 'easy',
            points: 50
        },
        {
            question: 'Which law states that for every action, there is an equal and opposite reaction?',
            options: ['First Law', 'Second Law', 'Third Law', 'Law of Gravitation'],
            correct: 2,
            difficulty: 'easy',
            points: 50
        },
        {
            question: 'The speed of light in vacuum is:',
            options: ['3 × 10⁸ m/s', '3 × 10⁷ m/s', '3 × 10⁶ m/s', '3 × 10⁹ m/s'],
            correct: 0,
            difficulty: 'medium',
            points: 75
        }
    ]
};

let currentQuiz = null;
let battleMode = null;
let quizScore = 0;
let questionIndex = 0;
let timeLeft = 30;
let quizTimer = null;
let xpWager = 0;
let opponentXPWager = 0;
let totalPot = 0;

// Start Battle
function startBattle(mode) {
    battleMode = mode;
    const modal = document.getElementById('quizModal');
    const content = document.getElementById('quizContent');
    
    if (mode === 'solo') {
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 20px;">🎯 Solo Practice Mode</h3>
                <p style="color: #64748b; margin-bottom: 20px;">Select a subject to practice:</p>
                <select id="subjectSelect" style="width: 100%; padding: 12px; margin-bottom: 20px; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem;">
                    <option value="Engineering Mechanics">Engineering Mechanics</option>
                    <option value="Mathematics-I">Mathematics-I</option>
                    <option value="Physics">Physics</option>
                </select>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600;">Difficulty Level:</label>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <label><input type="radio" name="difficulty" value="easy" checked> Easy (5 questions)</label>
                        <label><input type="radio" name="difficulty" value="medium"> Medium (7 questions)</label>
                        <label><input type="radio" name="difficulty" value="hard"> Hard (10 questions)</label>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="startSoloQuiz()">Start Quiz</button>
            </div>
        `;
    } else {
        // Show XP wagering interface for competitive battles
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 20px;">🏆 ${mode} XP Battle</h3>
                
                <div style="background: var(--light); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                    <h4 style="color: var(--primary); margin-bottom: 15px;">💰 Set Your XP Wager</h4>
                    <p style="color: #64748b; margin-bottom: 15px;">Your current XP: <strong>${userXP}</strong></p>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Wager Amount:</label>
                        <input type="range" id="xpWagerSlider" min="10" max="${Math.min(userXP, 500)}" value="${Math.min(50, userXP)}" 
                            style="width: 100%; margin-bottom: 10px;" oninput="updateWagerDisplay()">
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #64748b;">
                            <span>10 XP</span>
                            <span id="wagerDisplay" style="font-weight: bold; color: var(--primary); font-size: 1.1rem;">${Math.min(50, userXP)} XP</span>
                            <span>${Math.min(userXP, 500)} XP</span>
                        </div>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 15px;">
                        <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 0.9rem;">
                            ⚠️ Winner takes all XP from the pot!
                        </p>
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="findOpponent()" style="margin-bottom: 15px;">
                    🔍 Find Opponent & Start Battle
                </button>
                
                <button class="btn" style="background: var(--border); color: var(--dark);" onclick="closeQuizModal()">
                    Cancel
                </button>
            </div>
        `;
        
        // Set initial wager
        xpWager = Math.min(50, userXP);
        
        // Disable battle if user doesn't have enough XP
        if (userXP < 10) {
            content.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3 style="margin-bottom: 20px; color: var(--danger);">😔 Insufficient XP</h3>
                    <div style="background: #fef2f2; padding: 20px; border-radius: 12px; border-left: 4px solid var(--danger); margin-bottom: 20px;">
                        <p style="color: #dc2626; margin: 0;">You need at least 10 XP to enter a battle!</p>
                        <p style="color: #b91c1c; margin: 10px 0 0 0; font-size: 0.9rem;">Watch videos, comment, or practice solo quizzes to earn more XP.</p>
                    </div>
                    <button class="btn btn-primary" onclick="startBattle('solo')" style="margin-right: 10px;">
                        🎯 Practice Solo
                    </button>
                    <button class="btn" style="background: var(--border); color: var(--dark);" onclick="closeQuizModal()">
                        Back
                    </button>
                </div>
            `;
        }
    }
    
    modal.style.display = 'flex';
}

// XP Wagering Functions
function updateWagerDisplay() {
    const slider = document.getElementById('xpWagerSlider');
    const display = document.getElementById('wagerDisplay');
    xpWager = parseInt(slider.value);
    display.textContent = `${xpWager} XP`;
}

function findOpponent() {
    if (xpWager > userXP) {
        showToast('You don\'t have enough XP for this wager!', 'error');
        return;
    }
    
    const content = document.getElementById('quizContent');
    content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h3 style="margin-bottom: 20px;">🔍 Finding Opponent...</h3>
            <div style="background: var(--light); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <p style="margin-bottom: 10px; color: var(--primary); font-weight: 600;">Your Wager: ${xpWager} XP</p>
                <p style="color: #64748b;">Matching with players of similar XP levels...</p>
            </div>
            <div class="spinner"></div>
            <p style="margin-top: 15px; font-size: 0.9rem; color: #94a3b8;">This may take a few moments</p>
            <button class="btn" style="margin-top: 20px; background: #ef4444; color: white;" onclick="closeQuizModal()">Cancel</button>
        </div>
    `;
    
    // Simulate matchmaking
    setTimeout(() => {
        // Simulate opponent wager (similar to player's wager)
        opponentXPWager = Math.floor(xpWager * (0.8 + Math.random() * 0.4)); // 80% to 120% of player wager
        totalPot = xpWager + opponentXPWager;
        
        const opponentName = battleMode === '1v1' ? 'Alex_Kumar' : 'Team_Alpha';
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 20px;">⚔️ Match Found!</h3>
                
                <div style="background: var(--light); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 15px; align-items: center; margin-bottom: 15px;">
                        <div style="text-align: center;">
                            <div style="font-weight: bold; color: var(--primary);">${currentUser.fullName}</div>
                            <div style="color: #64748b; font-size: 0.9rem;">${currentUser.branch}</div>
                            <div style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 12px; font-weight: bold; margin-top: 5px;">
                                ${xpWager} XP
                            </div>
                        </div>
                        
                        <div style="font-size: 1.5rem; color: var(--primary); font-weight: bold;">VS</div>
                        
                        <div style="text-align: center;">
                            <div style="font-weight: bold; color: var(--danger);">${opponentName}</div>
                            <div style="color: #64748b; font-size: 0.9rem;">CSE</div>
                            <div style="background: #fecaca; color: #dc2626; padding: 4px 8px; border-radius: 12px; font-weight: bold; margin-top: 5px;">
                                ${opponentXPWager} XP
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #f0fdf4; border: 2px solid #16a34a; padding: 15px; border-radius: 12px;">
                        <div style="font-weight: bold; color: #16a34a; margin-bottom: 5px;">🏆 Prize Pool</div>
                        <div style="font-size: 1.8rem; font-weight: bold; color: #16a34a;">${totalPot} XP</div>
                        <div style="font-size: 0.9rem; color: #15803d; margin-top: 5px;">Winner takes all!</div>
                    </div>
                </div>
                
                <div style="background: #fef3c7; padding: 12px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 0.9rem;">
                        <strong>Subject:</strong> Engineering Mechanics | <strong>Questions:</strong> 10 | <strong>Time:</strong> 5 minutes
                    </p>
                </div>
                
                <button class="btn btn-primary" onclick="startXPBattle()">Accept Challenge! 💪</button>
            </div>
        `;
    }, 2500);
}
// Enhanced Quiz Functions
function startSoloQuiz() {
    const subject = document.getElementById('subjectSelect').value;
    const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    
    currentQuiz = quizQuestions[subject] || [];
    
    // Filter questions by difficulty if needed
    if (difficulty !== 'hard') {
        currentQuiz = currentQuiz.filter(q => 
            difficulty === 'easy' ? q.difficulty === 'easy' :
            q.difficulty === 'easy' || q.difficulty === 'medium'
        );
    }
    
    // Limit questions based on difficulty
    const questionLimit = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 7 : 10;
    currentQuiz = currentQuiz.slice(0, questionLimit);
    
    startQuizGame();
}

function startBattleQuiz() {
    currentQuiz = quizQuestions['Engineering Mechanics'].slice(0, 10);
    startQuizGame();
}

function startXPBattle() {
    // Deduct XP wager from player (held in escrow)
    userXP -= xpWager;
    document.getElementById('userXP').textContent = userXP;
    
    showToast(`${xpWager} XP placed in battle pot! 🏆`, 'warning');
    
    currentQuiz = quizQuestions['Engineering Mechanics'].slice(0, 10);
    startQuizGame();
}

function startQuizGame() {
    questionIndex = 0;
    quizScore = 0;
    timeLeft = battleMode === 'solo' ? 45 : 30; // More time for solo practice
    
    showQuestion();
}

function showQuestion() {
    if (questionIndex >= currentQuiz.length) {
        showQuizResults();
        return;
    }
    
    const question = currentQuiz[questionIndex];
    const content = document.getElementById('quizContent');
    
    // Start timer for this question
    timeLeft = battleMode === 'solo' ? 45 : 30;
    
    content.innerHTML = `
        <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center;">
                <div style="background: var(--primary); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                    Question ${questionIndex + 1}/${currentQuiz.length}
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="background: var(--success); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                        Score: ${quizScore}
                    </div>
                    <div id="timer" style="background: var(--warning); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                        ⏰ ${timeLeft}s
                    </div>
                </div>
            </div>
            
            <div style="background: var(--light); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="background: ${question.difficulty === 'easy' ? '#10b981' : question.difficulty === 'medium' ? '#f59e0b' : '#ef4444'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">
                        ${question.difficulty.toUpperCase()}
                    </span>
                    <span style="color: var(--primary); font-weight: bold;">
                        +${question.points} XP
                    </span>
                </div>
                <h3 style="color: var(--dark); line-height: 1.4;">${question.question}</h3>
            </div>
            
            <div style="display: grid; gap: 12px;">
                ${question.options.map((opt, idx) => `
                    <button class="quiz-option" style="background: white; border: 2px solid var(--border); text-align: left; padding: 15px 20px; border-radius: 12px; transition: all 0.3s; cursor: pointer; font-size: 1rem;" 
                        onmouseover="this.style.borderColor='var(--primary)'; this.style.background='#f8fafc';"
                        onmouseout="this.style.borderColor='var(--border)'; this.style.background='white';"
                        onclick="answerQuestion(${idx}, ${question.correct}, ${question.points})">
                        <span style="background: var(--primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; font-size: 0.9rem;">
                            ${String.fromCharCode(65 + idx)}
                        </span>
                        ${opt}
                    </button>
                `).join('')}
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
                <button class="btn" style="background: var(--danger); color: white;" onclick="skipQuestion()">
                    ⏭️ Skip Question
                </button>
            </div>
        </div>
    `;
    
    // Start countdown timer
    clearInterval(quizTimer);
    quizTimer = setInterval(() => {
        timeLeft--;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `⏰ ${timeLeft}s`;
            if (timeLeft <= 10) {
                timerElement.style.background = 'var(--danger)';
            }
        }
        
        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            showToast('⏰ Time\'s up!', 'warning');
            setTimeout(() => {
                questionIndex++;
                showQuestion();
            }, 1000);
        }
    }, 1000);
}

function answerQuestion(selected, correct, points) {
    clearInterval(quizTimer);
    
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((option, idx) => {
        option.style.pointerEvents = 'none';
        if (idx === correct) {
            option.style.background = 'var(--success)';
            option.style.borderColor = 'var(--success)';
            option.style.color = 'white';
        } else if (idx === selected && selected !== correct) {
            option.style.background = 'var(--danger)';
            option.style.borderColor = 'var(--danger)';
            option.style.color = 'white';
        }
    });
    
    if (selected === correct) {
        quizScore += points;
        showToast(`🎉 Correct! +${points} points`, 'success');
    } else {
        showToast('❌ Wrong answer. Better luck next time!', 'error');
    }
    
    setTimeout(() => {
        questionIndex++;
        showQuestion();
    }, 2000);
}

function skipQuestion() {
    clearInterval(quizTimer);
    showToast('⏭️ Question skipped', 'warning');
    setTimeout(() => {
        questionIndex++;
        showQuestion();
    }, 1000);
}

function showQuizResults() {
    clearInterval(quizTimer);
    const content = document.getElementById('quizContent');
    
    const totalQuestions = currentQuiz.length;
    const percentage = Math.round((quizScore / (totalQuestions * 100)) * 100);
    
    // Determine performance level
    let performance, emoji, color;
    if (percentage >= 80) {
        performance = 'Excellent!';
        emoji = '🎆';
        color = 'var(--success)';
    } else if (percentage >= 60) {
        performance = 'Good!';
        emoji = '😄';
        color = 'var(--warning)';
    } else {
        performance = 'Keep Practicing!';
        emoji = '💪';
        color = 'var(--danger)';
    }
    
    let xpEarned = 0;
    let battleResult = '';
    
    if (battleMode === 'solo') {
        // Solo mode - normal XP rewards
        xpEarned = Math.round(quizScore * 0.5);
        userXP += xpEarned;
    } else {
        // Battle mode - XP wagering results
        const opponentScore = Math.floor(Math.random() * (totalQuestions * 100)); // Simulate opponent score
        const playerWon = quizScore > opponentScore;
        
        if (playerWon) {
            // Player wins - gets total pot
            xpEarned = totalPot;
            userXP += xpEarned;
            battleResult = `
                <div style="background: #f0fdf4; border: 2px solid #16a34a; padding: 20px; border-radius: 16px; margin: 20px 0;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">🏆</div>
                    <h3 style="color: #16a34a; margin-bottom: 10px;">Victory!</h3>
                    <p style="color: #15803d; margin-bottom: 15px;">You won the XP battle!</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div style="text-align: center;">
                            <div style="color: #16a34a; font-weight: bold;">Your Score</div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #16a34a;">${quizScore}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #dc2626; font-weight: bold;">Opponent Score</div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #dc2626;">${opponentScore}</div>
                        </div>
                    </div>
                    <div style="background: #dcfce7; padding: 12px; border-radius: 8px;">
                        <div style="color: #166534; font-weight: bold;">💰 Prize Won: +${totalPot} XP</div>
                        <div style="color: #15803d; font-size: 0.9rem; margin-top: 5px;">Your ${xpWager} XP + Opponent's ${opponentXPWager} XP</div>
                    </div>
                </div>
            `;
        } else {
            // Player loses - loses wagered XP
            xpEarned = 0;
            battleResult = `
                <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 16px; margin: 20px 0;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">😔</div>
                    <h3 style="color: #dc2626; margin-bottom: 10px;">Defeat</h3>
                    <p style="color: #b91c1c; margin-bottom: 15px;">Better luck next time!</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div style="text-align: center;">
                            <div style="color: #dc2626; font-weight: bold;">Your Score</div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #dc2626;">${quizScore}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #16a34a; font-weight: bold;">Opponent Score</div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #16a34a;">${opponentScore}</div>
                        </div>
                    </div>
                    <div style="background: #fee2e2; padding: 12px; border-radius: 8px;">
                        <div style="color: #991b1b; font-weight: bold;">💸 XP Lost: -${xpWager} XP</div>
                        <div style="color: #b91c1c; font-size: 0.9rem; margin-top: 5px;">Your wagered XP went to the opponent</div>
                    </div>
                </div>
            `;
        }
    }
    
    document.getElementById('userXP').textContent = userXP;
    
    content.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">${emoji}</div>
            <h3 style="margin-bottom: 15px; color: ${color};">${performance}</h3>
            
            <div style="background: var(--light); padding: 25px; border-radius: 16px; margin: 20px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">${quizScore}</div>
                        <div style="color: #64748b;">Total Score</div>
                    </div>
                    <div>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--success);">${percentage}%</div>
                        <div style="color: #64748b;">Accuracy</div>
                    </div>
                </div>
                ${battleMode !== 'solo' ? '' : `
                    <div style="background: var(--primary); color: white; padding: 12px 20px; border-radius: 12px; font-weight: bold;">
                        ⚡ +${xpEarned} XP Earned!
                    </div>
                `}
            </div>
            
            ${battleResult}
            
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="btn btn-primary" onclick="${battleMode === 'solo' ? 'startSoloQuiz()' : battleMode === '1v1' || battleMode === '2v2' ? 'startBattle(\'' + battleMode + '\')' : 'startBattleQuiz()'}">
                    🔄 ${battleMode === 'solo' ? 'Practice Again' : 'New Battle'}
                </button>
                <button class="btn" style="background: var(--border); color: var(--dark);" onclick="closeQuizModal()">
                    🏠 Back to Home
                </button>
            </div>
        </div>
    `;
}

// Load Leaderboard
function loadLeaderboard() {
    const leaderboardTable = document.getElementById('leaderboardTable');
    leaderboardTable.innerHTML = '';
    
    // Add current user to leaderboard for demo
    const allUsers = [...leaderboardData, { name: currentUser?.fullName || 'You', branch: currentUser?.branch || 'CSE', xp: userXP }];
    allUsers.sort((a, b) => b.xp - a.xp);
    
    allUsers.forEach((user, index) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        
        let rankClass = '';
        let rankIcon = `#${index + 1}`;
        if (index === 0) {
            rankClass = 'gold';
            rankIcon = '🥇';
        } else if (index === 1) {
            rankClass = 'silver';
            rankIcon = '🥈';
        } else if (index === 2) {
            rankClass = 'bronze';
            rankIcon = '🥉';
        }
        
        row.innerHTML = `
            <div class="rank ${rankClass}">${rankIcon}</div>
            <div class="student-info">
                <div class="avatar">${user.name[0]}</div>
                <div>
                    <div class="student-name">${user.name} ${user.name === (currentUser?.fullName || 'You') ? '(You)' : ''}</div>
                    <div class="student-branch">${user.branch}</div>
                </div>
            </div>
            <div class="student-xp">${user.xp} XP</div>
        `;
        
        leaderboardTable.appendChild(row);
    });
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Initialize
document.getElementById('dashboardSection').style.display = 'none';

// Show app status information
setTimeout(() => {
    const isFileProtocol = location.protocol === 'file:';
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    
    if (isFileProtocol) {
        console.log(`
%c📁 EduQuest - File Protocol Mode
%c⚠️ Limited functionality detected!

%cTo enable full Firebase features:
🔧 Run the development server:
1. Double-click: start-server.bat
2. Or run: python serve.py
3. Visit: http://localhost:8000

%c📝 Current features (offline mode):
✅ Course browsing and video management
✅ Quiz battles and XP system
✅ Comments and social features
✅ Local authentication simulation

%c❌ Limited features:
❌ Real-time data sync
❌ Google Sign-in
❌ Multi-device access
❌ Persistent storage`, 
            'color: #f59e0b; font-size: 16px; font-weight: bold',
            'color: #ef4444; font-size: 14px',
            'color: #4a90e2; font-size: 14px',
            'color: #10b981; font-size: 14px',
            'color: #94a3b8; font-size: 14px'
        );
    } else if (firebaseInitialized) {
        console.log(`
%c🔥 EduQuest - Firebase Connected!
%c✅ All features are available:
✅ Real-time authentication
✅ Data synchronization  
✅ Multi-device access
✅ Persistent storage

%cApp is fully operational!`, 
            'color: #10b981; font-size: 16px; font-weight: bold',
            'color: #4a90e2; font-size: 14px',
            'color: #f59e0b; font-size: 14px'
        );
    } else {
        console.log(`
%c📝 EduQuest - Offline Mode
%c⚠️ Firebase connection failed, but don't worry!

%cWorking features:
✅ Course browsing and video management
✅ Quiz battles and XP system  
✅ Comments and social features
✅ Local authentication simulation

%cLimited features:
❌ Real-time data sync
❌ Multi-device access

%c🛠️ To enable Firebase:
1. Check your internet connection
2. Verify Firebase project settings
3. Ensure Authentication and Firestore are enabled
4. Add your domain to Firebase authorized domains`, 
            'color: #f59e0b; font-size: 16px; font-weight: bold',
            'color: #ef4444; font-size: 14px',
            'color: #10b981; font-size: 14px',
            'color: #94a3b8; font-size: 14px',
            'color: #4a90e2; font-size: 14px'
        );
    }
}, 1000);