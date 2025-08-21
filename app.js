// Global state management
let appData = {
    profile: {
        name: '',
        age: '',
        examDate: '',
        targetScore: 650
    },
    omrTests: [],
    mockTests: [],
    mistakes: [],
    checklist: {
        physics: [],
        chemistry: [],
        biology: []
    },
    habits: {
        dailyStudy: [false, false, false, false, false, false, false],
        mockTests: [false, false, false, false]
    },
    analytics: {
        weeklyProgress: [],
        subjectPerformance: {
            physics: 40,
            chemistry: 50,
            biology: 60
        }
    }
};

let omrState = {
    testConfig: {
        name: '',
        duration: 0,
        physicsCount: 0,
        chemistryCount: 0,
        biologyCount: 0,
        totalQuestions: 0
    },
    questions: [], // [{id, subject, displayNumber, subjectIndex}]
    answers: {}, // {questionId: answer}
    answerKey: {}, // {questionId: correctAnswer}
    results: {
        correct: [], // question IDs
        incorrect: [], // question IDs
        unanswered: [] // question IDs
    },
    timer: null,
    timeRemaining: 0
};

let studyTimer = {
    minutes: 25,
    seconds: 0,
    isRunning: false,
    interval: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing NEET Study Planner...');
    initializeApp();
});

function initializeApp() {
    // Load saved data (simulate localStorage)
    loadAppData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize UI
    updateDashboard();
    updateTotalQuestions();
    renderMistakes();
    renderMockTests();
    updateStudyTimerDisplay(); // Fixed: Ensure timer display is initialized
    
    console.log('App initialized successfully');
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfile();
        });
    }
    
    // OMR Setup form
    const setupForm = document.getElementById('setup-form');
    if (setupForm) {
        setupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            startOMRTest(e);
        });
    }
    
    // Question count inputs
    ['physics-count', 'chemistry-count', 'biology-count'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateTotalQuestions);
        }
    });
    
    // OMR Test actions
    const submitTest = document.getElementById('submit-test');
    if (submitTest) {
        submitTest.addEventListener('click', submitOMRTest);
    }
    
    const submitAnswerKey = document.getElementById('submit-answer-key');
    if (submitAnswerKey) {
        submitAnswerKey.addEventListener('click', processAnswerKeySubmission);
    }
    
    // Navigation buttons
    const viewImprovement = document.getElementById('view-improvement');
    if (viewImprovement) {
        viewImprovement.addEventListener('click', function() {
            switchTab('mistakes');
        });
    }
    
    const startNewTest = document.getElementById('start-new-test');
    if (startNewTest) {
        startNewTest.addEventListener('click', resetAndStartNewTest);
    }
    
    // Mistakes filter
    const subjectFilter = document.getElementById('subject-filter');
    if (subjectFilter) {
        subjectFilter.addEventListener('change', renderMistakes);
    }
    
    // Timer controls - Fixed event listeners
    const timerStart = document.getElementById('timer-start');
    const timerPause = document.getElementById('timer-pause');
    const timerReset = document.getElementById('timer-reset');
    const studyDuration = document.getElementById('study-duration');
    
    if (timerStart) {
        timerStart.addEventListener('click', startStudyTimer);
        console.log('Timer start button listener added');
    }
    if (timerPause) {
        timerPause.addEventListener('click', pauseStudyTimer);
        console.log('Timer pause button listener added');
    }
    if (timerReset) {
        timerReset.addEventListener('click', resetStudyTimer);
        console.log('Timer reset button listener added');
    }
    if (studyDuration) {
        studyDuration.addEventListener('change', function() {
            studyTimer.minutes = parseInt(this.value) || 25;
            studyTimer.seconds = 0;
            updateStudyTimerDisplay();
        });
        console.log('Study duration input listener added');
    }
    
    // Checklist checkboxes
    document.querySelectorAll('.checklist-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const section = this.closest('.checklist-items');
            const subject = section.dataset.subject;
            const index = Array.from(section.querySelectorAll('.checklist-checkbox')).indexOf(this);
            
            if (!appData.checklist[subject]) {
                appData.checklist[subject] = [];
            }
            appData.checklist[subject][index] = this.checked;
            updateDashboard();
        });
    });
    
    console.log('All event listeners set up');
}

// Tab Navigation
function switchTab(tabId) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab and content
    const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(tabId);
    
    if (selectedBtn && selectedContent) {
        selectedBtn.classList.add('active');
        selectedContent.classList.add('active');
        
        // Special handling for timer tab - ensure display is updated
        if (tabId === 'timer') {
            updateStudyTimerDisplay();
            console.log('Timer tab activated, display updated');
        }
    }
    
    console.log(`Switched to tab: ${tabId}`);
}

// Profile Management
function saveProfile() {
    const name = document.getElementById('student-name').value.trim();
    const age = document.getElementById('student-age').value;
    const examDate = document.getElementById('exam-date').value;
    const targetScore = document.getElementById('target-score').value;
    
    if (!name || !age || !examDate || !targetScore) {
        alert('Please fill in all fields');
        return;
    }
    
    appData.profile = {
        name: name,
        age: parseInt(age),
        examDate: examDate,
        targetScore: parseInt(targetScore)
    };
    
    updateDashboard();
    alert('Profile saved successfully!');
    console.log('Profile saved:', appData.profile);
}

// Dashboard Updates
function updateDashboard() {
    // Update progress percentages
    const physicsProgress = appData.analytics.subjectPerformance.physics;
    const chemistryProgress = appData.analytics.subjectPerformance.chemistry;
    const biologyProgress = appData.analytics.subjectPerformance.biology;
    const overallProgress = Math.round((physicsProgress + chemistryProgress + biologyProgress) / 3);
    
    // Update percentage displays
    const overallEl = document.getElementById('overall-percentage');
    const physicsEl = document.getElementById('physics-percentage');
    const chemistryEl = document.getElementById('chemistry-percentage');
    const biologyEl = document.getElementById('biology-percentage');
    
    if (overallEl) overallEl.textContent = overallProgress + '%';
    if (physicsEl) physicsEl.textContent = physicsProgress + '%';
    if (chemistryEl) chemistryEl.textContent = chemistryProgress + '%';
    if (biologyEl) biologyEl.textContent = biologyProgress + '%';
    
    // Update circular progress
    updateCircularProgress('overall-progress', overallProgress);
    updateCircularProgress('physics-progress', physicsProgress);
    updateCircularProgress('chemistry-progress', chemistryProgress);
    updateCircularProgress('biology-progress', biologyProgress);
    
    // Update quick stats
    const totalTestsEl = document.getElementById('total-tests');
    const avgScoreEl = document.getElementById('avg-score');
    const totalMistakesEl = document.getElementById('total-mistakes');
    
    if (totalTestsEl) totalTestsEl.textContent = appData.omrTests.length;
    if (avgScoreEl) {
        const avgScore = appData.omrTests.length > 0 
            ? Math.round(appData.omrTests.reduce((sum, test) => sum + test.score, 0) / appData.omrTests.length)
            : 0;
        avgScoreEl.textContent = avgScore;
    }
    if (totalMistakesEl) totalMistakesEl.textContent = appData.mistakes.length;
}

function updateCircularProgress(elementId, percentage) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const circumference = 2 * Math.PI * (elementId === 'overall-progress' ? 50 : 35);
    const offset = circumference - (percentage / 100) * circumference;
    
    element.style.strokeDasharray = circumference;
    element.style.strokeDashoffset = offset;
}

// OMR Functionality (Fixed Implementation)
function updateTotalQuestions() {
    const physicsCountEl = document.getElementById('physics-count');
    const chemistryCountEl = document.getElementById('chemistry-count');
    const biologyCountEl = document.getElementById('biology-count');
    const totalCountEl = document.getElementById('total-count');
    
    if (!physicsCountEl || !chemistryCountEl || !biologyCountEl || !totalCountEl) {
        return;
    }
    
    const physicsCount = parseInt(physicsCountEl.value) || 0;
    const chemistryCount = parseInt(chemistryCountEl.value) || 0;
    const biologyCount = parseInt(biologyCountEl.value) || 0;
    const total = physicsCount + chemistryCount + biologyCount;
    
    totalCountEl.textContent = total.toString();
}

function startOMRTest(event) {
    event.preventDefault();
    
    const testName = document.getElementById('test-name').value.trim();
    const duration = parseInt(document.getElementById('test-duration').value);
    const physicsCount = parseInt(document.getElementById('physics-count').value) || 0;
    const chemistryCount = parseInt(document.getElementById('chemistry-count').value) || 0;
    const biologyCount = parseInt(document.getElementById('biology-count').value) || 0;
    
    if (!testName || !duration || (physicsCount + chemistryCount + biologyCount) === 0) {
        alert('Please fill in all required fields and add at least one question.');
        return;
    }
    
    // Store test configuration with fixed subject distribution
    omrState.testConfig = {
        name: testName,
        duration: duration,
        physicsCount: physicsCount,
        chemistryCount: chemistryCount,
        biologyCount: biologyCount,
        totalQuestions: physicsCount + chemistryCount + biologyCount
    };
    
    // Reset state for new test
    omrState.questions = [];
    omrState.answers = {};
    omrState.answerKey = {};
    omrState.results = { correct: [], incorrect: [], unanswered: [] };
    
    // Setup OMR test with proper subject distribution (FIXED)
    setupOMRTestFixed();
    
    // Show test interface
    showOMRSection('omr-test');
    
    // Start timer
    startOMRTimer();
    
    console.log('OMR test started with fixed distribution:', omrState.testConfig);
}

function setupOMRTestFixed() {
    const { physicsCount, chemistryCount, biologyCount } = omrState.testConfig;
    let questionNumber = 1;
    
    // Generate exact number of physics questions (FIXED)
    for (let i = 0; i < physicsCount; i++) {
        omrState.questions.push({
            id: questionNumber++,
            subject: 'physics',
            displayNumber: i + 1,
            subjectIndex: i + 1
        });
    }
    
    // Generate exact number of chemistry questions (FIXED)
    for (let i = 0; i < chemistryCount; i++) {
        omrState.questions.push({
            id: questionNumber++,
            subject: 'chemistry',
            displayNumber: i + 1,
            subjectIndex: i + 1
        });
    }
    
    // Generate exact number of biology questions (FIXED)
    for (let i = 0; i < biologyCount; i++) {
        omrState.questions.push({
            id: questionNumber++,
            subject: 'biology',
            displayNumber: i + 1,
            subjectIndex: i + 1
        });
    }
    
    // Update UI
    document.getElementById('current-test-name').textContent = omrState.testConfig.name;
    document.getElementById('total-questions').textContent = omrState.testConfig.totalQuestions.toString();
    
    // Render OMR grid
    renderOMRGrid();
    updateOMRProgress();
}

function renderOMRGrid() {
    const grid = document.getElementById('omr-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    omrState.questions.forEach(question => {
        const questionElement = createOMRQuestion(question);
        grid.appendChild(questionElement);
    });
}

function createOMRQuestion(question) {
    const div = document.createElement('div');
    div.className = 'omr-question';
    
    div.innerHTML = `
        <div class="question-header">
            <span class="question-number">Q${question.id}</span>
            <span class="subject-tag ${question.subject}">${question.subject.toUpperCase()}</span>
        </div>
        <div class="options-grid">
            ${['A', 'B', 'C', 'D'].map(option => `
                <div class="option-bubble" data-question="${question.id}" data-option="${option}">
                    ${option}
                </div>
            `).join('')}
        </div>
    `;
    
    // Add click event listeners to option bubbles
    div.querySelectorAll('.option-bubble').forEach(bubble => {
        bubble.addEventListener('click', function() {
            selectAnswer(this);
        });
    });
    
    return div;
}

function selectAnswer(bubble) {
    const questionId = bubble.dataset.question;
    const option = bubble.dataset.option;
    
    // Remove selection from other options in same question
    const questionDiv = bubble.closest('.omr-question');
    questionDiv.querySelectorAll('.option-bubble').forEach(b => {
        b.classList.remove('selected');
    });
    
    // Select this option
    bubble.classList.add('selected');
    
    // Store answer
    omrState.answers[questionId] = option;
    
    // Update progress
    updateOMRProgress();
}

function updateOMRProgress() {
    const answeredCount = Object.keys(omrState.answers).length;
    const totalCount = omrState.testConfig.totalQuestions;
    const percentage = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
    
    const progressCountEl = document.getElementById('progress-count');
    const progressFillEl = document.getElementById('progress-fill');
    
    if (progressCountEl) progressCountEl.textContent = answeredCount.toString();
    if (progressFillEl) progressFillEl.style.width = percentage + '%';
}

function startOMRTimer() {
    omrState.timeRemaining = omrState.testConfig.duration * 60;
    
    omrState.timer = setInterval(() => {
        omrState.timeRemaining--;
        updateOMRTimerDisplay();
        
        if (omrState.timeRemaining <= 0) {
            clearInterval(omrState.timer);
            submitOMRTest();
        }
    }, 1000);
    
    updateOMRTimerDisplay();
}

function updateOMRTimerDisplay() {
    const hours = Math.floor(omrState.timeRemaining / 3600);
    const minutes = Math.floor((omrState.timeRemaining % 3600) / 60);
    const seconds = omrState.timeRemaining % 60;
    
    const display = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.textContent = display;
}

function submitOMRTest() {
    if (omrState.timer) {
        clearInterval(omrState.timer);
    }
    
    showOMRSection('answer-key');
    renderAnswerKeyGrid();
}

function renderAnswerKeyGrid() {
    const grid = document.getElementById('answer-key-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    omrState.questions.forEach(question => {
        const answerKeyItem = createAnswerKeyItem(question);
        grid.appendChild(answerKeyItem);
    });
}

function createAnswerKeyItem(question) {
    const div = document.createElement('div');
    div.className = 'answer-key-item';
    
    div.innerHTML = `
        <div class="question-header">
            <span class="question-number">Q${question.id}</span>
            <span class="subject-tag ${question.subject}">${question.subject.toUpperCase()}</span>
        </div>
        <div class="options-grid">
            ${['A', 'B', 'C', 'D'].map(option => `
                <div class="option-bubble" data-question="${question.id}" data-option="${option}">
                    ${option}
                </div>
            `).join('')}
        </div>
    `;
    
    div.querySelectorAll('.option-bubble').forEach(bubble => {
        bubble.addEventListener('click', function() {
            selectAnswerKey(this);
        });
    });
    
    return div;
}

function selectAnswerKey(bubble) {
    const questionId = bubble.dataset.question;
    const option = bubble.dataset.option;
    
    // Remove selection from other options in same question
    const questionDiv = bubble.closest('.answer-key-item');
    questionDiv.querySelectorAll('.option-bubble').forEach(b => {
        b.classList.remove('selected');
    });
    
    // Select this option
    bubble.classList.add('selected');
    
    // Store answer key
    omrState.answerKey[questionId] = option;
}

function processAnswerKeySubmission() {
    // Validate all questions have answer keys
    const missingKeys = omrState.questions.filter(q => !omrState.answerKey[q.id.toString()]);
    if (missingKeys.length > 0) {
        alert(`Please provide answer keys for all questions. Missing: ${missingKeys.map(q => `Q${q.id}`).join(', ')}`);
        return;
    }
    
    // Process results with enhanced tracking
    processResultsFixed();
    
    // Show results section
    showOMRSection('results');
    renderResults();
}

function processResultsFixed() {
    omrState.results = {
        correct: [],
        incorrect: [],
        unanswered: []
    };
    
    omrState.questions.forEach(question => {
        const questionId = question.id.toString();
        const userAnswer = omrState.answers[questionId];
        const correctAnswer = omrState.answerKey[questionId];
        
        if (!userAnswer) {
            omrState.results.unanswered.push(questionId);
        } else if (userAnswer === correctAnswer) {
            omrState.results.correct.push(questionId);
        } else {
            omrState.results.incorrect.push(questionId);
            // Add to mistakes with enhanced tracking (FIXED)
            addToMistakesFixed(question, userAnswer, correctAnswer);
        }
    });
    
    // Save test to history
    const testResult = {
        id: Date.now(),
        name: omrState.testConfig.name,
        date: new Date().toISOString(),
        score: (omrState.results.correct.length * 4) - (omrState.results.incorrect.length * 1),
        correct: omrState.results.correct.length,
        incorrect: omrState.results.incorrect.length,
        unanswered: omrState.results.unanswered.length,
        total: omrState.testConfig.totalQuestions
    };
    
    appData.omrTests.push(testResult);
    updateDashboard();
}

function addToMistakesFixed(question, userAnswer, correctAnswer) {
    const mistake = {
        id: Date.now() + Math.random(),
        questionId: question.id,
        questionNumber: question.id,
        subject: question.subject,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer,
        date: new Date().toISOString(),
        reviewed: false,
        testName: omrState.testConfig.name
    };
    
    appData.mistakes.push(mistake);
}

function renderResults() {
    const correctCount = omrState.results.correct.length;
    const incorrectCount = omrState.results.incorrect.length;
    const unansweredCount = omrState.results.unanswered.length;
    const totalScore = (correctCount * 4) - (incorrectCount * 1);
    
    // Update score display
    document.getElementById('final-score').textContent = totalScore.toString();
    document.getElementById('correct-count').textContent = correctCount.toString();
    document.getElementById('incorrect-count').textContent = incorrectCount.toString();
    document.getElementById('unanswered-count').textContent = unansweredCount.toString();
    
    // Render question breakdown with specific question numbers
    renderQuestionBreakdown();
    
    // Render subject analysis
    renderSubjectAnalysis();
}

function renderQuestionBreakdown() {
    const container = document.getElementById('question-breakdown');
    if (!container) return;
    
    container.innerHTML = '';
    
    omrState.questions.forEach(question => {
        const questionId = question.id.toString();
        const div = document.createElement('div');
        div.className = 'question-result';
        
        if (omrState.results.correct.includes(questionId)) {
            div.classList.add('correct');
            div.textContent = `Q${question.id} ✓`;
        } else if (omrState.results.incorrect.includes(questionId)) {
            div.classList.add('incorrect');
            div.textContent = `Q${question.id} ✗`;
        } else {
            div.classList.add('unanswered');
            div.textContent = `Q${question.id} —`;
        }
        
        container.appendChild(div);
    });
}

function renderSubjectAnalysis() {
    const container = document.getElementById('subject-stats');
    if (!container) return;
    
    container.innerHTML = '';
    
    const subjects = ['physics', 'chemistry', 'biology'];
    
    subjects.forEach(subject => {
        const subjectQuestions = omrState.questions.filter(q => q.subject === subject);
        if (subjectQuestions.length === 0) return;
        
        const correct = subjectQuestions.filter(q => 
            omrState.results.correct.includes(q.id.toString())
        ).length;
        const incorrect = subjectQuestions.filter(q => 
            omrState.results.incorrect.includes(q.id.toString())
        ).length;
        const unanswered = subjectQuestions.filter(q => 
            omrState.results.unanswered.includes(q.id.toString())
        ).length;
        
        const div = document.createElement('div');
        div.className = 'subject-stat';
        div.innerHTML = `
            <h4>
                <span class="subject-tag ${subject}">${subject.toUpperCase()}</span>
            </h4>
            <div class="subject-progress">
                <span>Correct: ${correct}</span>
                <span>Total: ${subjectQuestions.length}</span>
            </div>
            <div class="subject-progress">
                <span>Incorrect: ${incorrect}</span>
                <span>Unanswered: ${unanswered}</span>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// Enhanced Mistakes/Improvement Section
function renderMistakes() {
    const container = document.getElementById('mistakes-list');
    if (!container) return;
    
    const filter = document.getElementById('subject-filter')?.value || '';
    let filteredMistakes = appData.mistakes;
    
    if (filter) {
        filteredMistakes = appData.mistakes.filter(mistake => mistake.subject === filter);
    }
    
    container.innerHTML = '';
    
    if (filteredMistakes.length === 0) {
        container.innerHTML = '<div class="empty-state">No mistakes found for the selected filter.</div>';
        return;
    }
    
    filteredMistakes.forEach((mistake, index) => {
        const div = document.createElement('div');
        div.className = 'mistake-item';
        
        div.innerHTML = `
            <span class="subject-tag ${mistake.subject}">${mistake.subject.toUpperCase()}</span>
            <div class="mistake-info">
                <div class="mistake-question">Question ${mistake.questionNumber} (${mistake.testName || 'Test'})</div>
                <div class="mistake-details">Date: ${new Date(mistake.date).toLocaleDateString()}</div>
                <div class="mistake-answers">
                    <span class="user-answer">Your: ${mistake.userAnswer}</span>
                    <span class="correct-answer">Correct: ${mistake.correctAnswer}</span>
                </div>
            </div>
            <div class="mistake-actions">
                <input type="checkbox" class="review-checkbox" ${mistake.reviewed ? 'checked' : ''} 
                       data-mistake-id="${mistake.id}" onchange="toggleMistakeReviewed(this)">
                <label>Reviewed</label>
            </div>
        `;
        
        container.appendChild(div);
    });
}

function toggleMistakeReviewed(checkbox) {
    const mistakeId = checkbox.dataset.mistakeId;
    const mistake = appData.mistakes.find(m => m.id == mistakeId);
    
    if (mistake) {
        mistake.reviewed = checkbox.checked;
        console.log(`Mistake ${mistakeId} marked as ${mistake.reviewed ? 'reviewed' : 'not reviewed'}`);
    }
}

// Mock Tests Management
function renderMockTests() {
    const container = document.getElementById('mock-tests-list');
    if (!container) return;
    
    if (appData.omrTests.length === 0) {
        container.innerHTML = '<div class="empty-state">No mock tests taken yet. Use OMR Practice to create your first test!</div>';
        return;
    }
    
    container.innerHTML = '';
    
    appData.omrTests.forEach(test => {
        const div = document.createElement('div');
        div.className = 'card';
        
        div.innerHTML = `
            <div class="card__header">
                <h3>${test.name}</h3>
                <span class="status status--${test.score >= 400 ? 'success' : test.score >= 200 ? 'warning' : 'error'}">
                    Score: ${test.score}
                </span>
            </div>
            <div class="card__body">
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${test.correct}</span>
                        <span class="stat-label">Correct</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${test.incorrect}</span>
                        <span class="stat-label">Incorrect</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${test.unanswered}</span>
                        <span class="stat-label">Unanswered</span>
                    </div>
                </div>
                <p><small>Taken on: ${new Date(test.date).toLocaleDateString()}</small></p>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// Study Timer (Fixed)
function startStudyTimer() {
    if (!studyTimer.isRunning) {
        studyTimer.isRunning = true;
        
        // Update button states
        const startBtn = document.getElementById('timer-start');
        const pauseBtn = document.getElementById('timer-pause');
        if (startBtn) startBtn.textContent = 'Running...';
        if (pauseBtn) pauseBtn.textContent = 'Pause';
        
        studyTimer.interval = setInterval(() => {
            if (studyTimer.seconds === 0) {
                if (studyTimer.minutes === 0) {
                    // Timer finished
                    pauseStudyTimer();
                    alert('Study session completed! Great job! 🎉');
                    return;
                }
                studyTimer.minutes--;
                studyTimer.seconds = 59;
            } else {
                studyTimer.seconds--;
            }
            updateStudyTimerDisplay();
        }, 1000);
        
        console.log('Study timer started');
    }
}

function pauseStudyTimer() {
    studyTimer.isRunning = false;
    if (studyTimer.interval) {
        clearInterval(studyTimer.interval);
        studyTimer.interval = null;
    }
    
    // Update button states
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    if (startBtn) startBtn.textContent = 'Start';
    if (pauseBtn) pauseBtn.textContent = 'Paused';
    
    console.log('Study timer paused');
}

function resetStudyTimer() {
    pauseStudyTimer();
    studyTimer.minutes = parseInt(document.getElementById('study-duration')?.value) || 25;
    studyTimer.seconds = 0;
    updateStudyTimerDisplay();
    
    // Reset button states
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    if (startBtn) startBtn.textContent = 'Start';
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    
    console.log('Study timer reset to', studyTimer.minutes, 'minutes');
}

function updateStudyTimerDisplay() {
    const display = `${studyTimer.minutes.toString().padStart(2, '0')}:${studyTimer.seconds.toString().padStart(2, '0')}`;
    const timerEl = document.getElementById('study-timer');
    if (timerEl) {
        timerEl.textContent = display;
        console.log('Timer display updated:', display);
    } else {
        console.error('Study timer element not found');
    }
}

// Utility functions
function showOMRSection(sectionId) {
    // Hide all OMR sections
    document.querySelectorAll('.omr-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
}

function resetAndStartNewTest() {
    // Clear timer if running
    if (omrState.timer) {
        clearInterval(omrState.timer);
    }
    
    // Reset OMR state
    omrState = {
        testConfig: {
            name: '',
            duration: 0,
            physicsCount: 0,
            chemistryCount: 0,
            biologyCount: 0,
            totalQuestions: 0
        },
        questions: [],
        answers: {},
        answerKey: {},
        results: {
            correct: [],
            incorrect: [],
            unanswered: []
        },
        timer: null,
        timeRemaining: 0
    };
    
    // Reset form
    const setupForm = document.getElementById('setup-form');
    if (setupForm) setupForm.reset();
    
    // Reset default values
    document.getElementById('physics-count').value = '0';
    document.getElementById('chemistry-count').value = '0';
    document.getElementById('biology-count').value = '10';
    
    updateTotalQuestions();
    
    // Show setup section
    showOMRSection('omr-setup');
    
    // Switch to OMR practice tab
    switchTab('omr-practice');
}

function loadAppData() {
    // Simulate loading from localStorage
    // In a real app, this would load from localStorage or a server
    console.log('Loading app data...');
}

function saveAppData() {
    // Simulate saving to localStorage
    // In a real app, this would save to localStorage or a server
    console.log('Saving app data...');
}

// Auto-save data periodically
setInterval(() => {
    saveAppData();
}, 30000); // Save every 30 seconds