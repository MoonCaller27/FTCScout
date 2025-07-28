const STORAGE_KEYS = {
    QUESTIONS: 'ftc_scouting_questions',
    DATA: 'ftc_scouting_data'
};

const DEFAULT_QUESTIONS = [
    { id: 1, text: 'Team Number', type: 'number', required: true, category: 'basic' },
    { id: 2, text: 'Team Name', type: 'text', required: true, category: 'basic' },
    { id: 3, text: 'Alliance with this team?', type: 'select', options: ['Yes', 'No', 'I don\'t play with/against this team'], required: true, category: 'basic' },
    { id: 4, text: 'How many points can be scored in Auto?', type: 'number', required: false, category: 'Auto' },
    { id: 5, text: 'How many points can be scored in Teleop?', type: 'number', required: false, category: 'Teleop' },
    { id: 6, text: 'Endgame Performance', type: 'select', options: ['None', 'Parked', 'Hanging'], required: false, category: 'endgame' },
    { id: 7, text: 'Additional Notes', type: 'text', required: false, category: 'notes' }
];

function generateId() {
    return Date.now() + Math.random();
}

function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
}

function loadFromStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return defaultValue;
    }
}

function showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message ${type} fade-in`;
    message.textContent = text;

    const main = document.querySelector('main');
    main.insertBefore(message, main.firstChild);

    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 3000);
}

function initializeIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function getQuestions() {
    const questions = loadFromStorage(STORAGE_KEYS.QUESTIONS, DEFAULT_QUESTIONS);
    if (questions.length === 0) {
        return DEFAULT_QUESTIONS;
    }
    return questions;
}

function saveQuestions(questions) {
    return saveToStorage(STORAGE_KEYS.QUESTIONS, questions);
}

function getScoutingData() {
    return loadFromStorage(STORAGE_KEYS.DATA, []);
}

function saveScoutingData(data) {
    return saveToStorage(STORAGE_KEYS.DATA, data);
}

function resetQuestionsToDefault() {
    saveQuestions(DEFAULT_QUESTIONS);
}
function renderFormInput(question, value = '') {
    switch (question.type) {
        case 'number':
            return `<input type="number" id="q-${question.id}" value="${value}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter number">`;
        
        case 'select':
            const options = question.options ? question.options.map(option => 
                `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`
            ).join('') : '';
            return `<select id="q-${question.id}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select an option</option>
                ${options}
            </select>`;
        
        case 'range':
            const min = question.min || 1;
            const max = question.max || 10;
            const rangeValue = value || min;
            return `<div class="space-y-2">
                <input type="range" id="q-${question.id}" min="${min}" max="${max}" value="${rangeValue}" class="w-full">
                <div class="text-center text-sm text-gray-600">Value: <span id="range-value-${question.id}">${rangeValue}</span></div>
            </div>`;
        
        case 'checkbox':
            return `<input type="checkbox" id="q-${question.id}" ${value ? 'checked' : ''} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">`;
        
        default:
            return `<input type="text" id="q-${question.id}" value="${value}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter text">`;
    }
}

function groupQuestionsByCategory(questions) {
    return questions.reduce((acc, question) => {
        const category = question.category || 'general';
        if (!acc[category]) acc[category] = [];
        acc[category].push(question);
        return acc;
    }, {});
}
function initializeScoutingForm() {
    const questions = getQuestions();
    const groupedQuestions = groupQuestionsByCategory(questions);
    const formQuestions = document.getElementById('form-questions');
    
    if (!formQuestions) return; 
    
    let html = '';
    for (const [category, categoryQuestions] of Object.entries(groupedQuestions)) {
        html += `
            <div class="mb-8">
                <h3 class="text-lg font-semibold text-gray-700 mb-4 capitalize border-b pb-2">${category}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        `;
        
        categoryQuestions.forEach(question => {
            html += `
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">
                        ${question.text}
                        ${question.required ? '<span class="text-red-500 ml-1">*</span>' : ''}
                    </label>
                    ${renderFormInput(question)}
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    formQuestions.innerHTML = html;
    addFormEventListeners(questions);
    initializeIcons();
}

function addFormEventListeners(questions) {
    questions.forEach(question => {
        const input = document.getElementById(`q-${question.id}`);
        if (input) {
            if (question.type === 'range') {
                input.addEventListener('input', (e) => {
                    const valueDisplay = document.getElementById(`range-value-${question.id}`);
                    if (valueDisplay) {
                        valueDisplay.textContent = e.target.value;
                    }
                });
            }
        }
    });
}

function submitScoutingForm() {
    const questions = getQuestions();
    const formData = {};
    questions.forEach(question => {
        const input = document.getElementById(`q-${question.id}`);
        if (input) {
            if (question.type === 'checkbox') {
                formData[question.id] = input.checked;
            } else {
                formData[question.id] = input.value;
            }
        }
    });
    const requiredQuestions = questions.filter(q => q.required);
    const missingFields = requiredQuestions.filter(q => {
        const value = formData[q.id];
        return value === undefined || value === '' || value === null;
    });
    
    if (missingFields.length > 0) {
        const fieldNames = missingFields.map(q => q.text).join(', ');
        showMessage(`Please fill in required fields: ${fieldNames}`, 'error');
        return;
    }
    const scoutingData = getScoutingData();
    const newEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        data: formData
    };
    
    scoutingData.push(newEntry);
    
    if (saveScoutingData(scoutingData)) {
        showMessage('Scouting data saved', 'success');
        questions.forEach(question => {
            const input = document.getElementById(`q-${question.id}`);
            if (input) {
                if (question.type === 'checkbox') {
                    input.checked = false;
                } else {
                    input.value = question.type === 'range' ? (question.min || 1) : '';
                }
                if (question.type === 'range') {
                    const valueDisplay = document.getElementById(`range-value-${question.id}`);
                    if (valueDisplay) {
                        valueDisplay.textContent = question.min || 1;
                    }
                }
            }
        });
    } else {
        showMessage('Failed to save scouting data. Please try again.', 'error');
    }
}
function loadDataPage(teamFilter = '') {
    const scoutingData = getScoutingData();
    const questions = getQuestions();
    
    const noDataEl = document.getElementById('no-data');
    const dataDisplayEl = document.getElementById('data-display');
    
    if (!noDataEl || !dataDisplayEl) return; 
    
    if (scoutingData.length === 0) {
        noDataEl.classList.remove('hidden');
        dataDisplayEl.classList.add('hidden');
        return;
    }
    
    noDataEl.classList.add('hidden');
    dataDisplayEl.classList.remove('hidden');
    const filteredData = teamFilter
      ? scoutingData.filter(entry => {
          const teamNum = entry.data[1] && entry.data[1].toString().toLowerCase();
          return teamNum && teamNum.includes(teamFilter);
        })
      : scoutingData;

    
    
    updateSummaryCards(filteredData, questions);
    
    
    renderDataTable(filteredData, questions);
}

function updateSummaryCards(data, questions) {
    const totalEntriesEl = document.getElementById('total-entries');
    const teamsScoutedEl = document.getElementById('teams-scouted');
    const matchesRecordedEl = document.getElementById('matches-recorded');
    
    if (totalEntriesEl) totalEntriesEl.textContent = data.length;
    
    
    const uniqueTeams = new Set();
    data.forEach(entry => {
        if (entry.data[1]) uniqueTeams.add(entry.data[1]);
    });
    if (teamsScoutedEl) teamsScoutedEl.textContent = uniqueTeams.size;
    
    const uniqueMatches = new Set();
    data.forEach(entry => {
        if (entry.data[2]) uniqueMatches.add(entry.data[2]);
    });
    if (matchesRecordedEl) matchesRecordedEl.textContent = uniqueMatches.size;
}

function renderDataTable(data, questions) {
    const tableHead = document.getElementById('data-table-head');
    const tableBody = document.getElementById('data-table-body');
    
    if (!tableHead || !tableBody) return; 
    const answeredQuestions = questions.filter(q => 
        data.some(entry => entry.data[q.id] !== undefined && entry.data[q.id] !== '')
    );
    
    let headerHtml = '<tr><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>';
    answeredQuestions.forEach(question => {
        const shortText = question.text.length > 15 ? question.text.substring(0, 15) + '...' : question.text;
        headerHtml += `<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" title="${question.text}">${shortText}</th>`;
    });
    headerHtml += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr>';
    tableHead.innerHTML = headerHtml;
    
    let bodyHtml = '';
    data.forEach(entry => {
        bodyHtml += `<tr class="hover:bg-gray-50">
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                ${new Date(entry.timestamp).toLocaleDateString()}<br>
                <span class="text-xs text-gray-500">${new Date(entry.timestamp).toLocaleTimeString()}</span>
            </td>`;
        
        answeredQuestions.forEach(question => {
            const value = entry.data[question.id];
            let displayValue = 'N/A';
            
            if (value !== undefined && value !== '') {
                if (question.type === 'checkbox') {
                    displayValue = value ? 'Yes' : 'No';
                }  else {
                    displayValue = value;
                }
            }
            
            bodyHtml += `<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900" title="${value || 'N/A'}">${displayValue}</td>`;
        });
        
        bodyHtml += `<td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
            <div class="flex gap-2">
                <button onclick="viewEntry('${entry.id}')" class="text-blue-600 hover:text-blue-800 text-xs bg-blue-100 px-2 py-1 rounded">View</button>
                <button onclick="deleteEntry('${entry.id}')" class="text-red-600 hover:text-red-800">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </td></tr>`;
    });
    tableBody.innerHTML = bodyHtml;
    initializeIcons();
}

function viewEntry(entryId) {
    const scoutingData = getScoutingData();
    const questions = getQuestions();
    const entry = scoutingData.find(e => e.id == entryId);
    
    if (!entry) return;
    
    const answeredQuestions = questions.filter(q => 
        entry.data[q.id] !== undefined && entry.data[q.id] !== ''
    );
    
    let detailsHtml = `<div class="mb-4"><strong>Timestamp:</strong> ${new Date(entry.timestamp).toLocaleString()}</div>`;
    
    answeredQuestions.forEach(question => {
        let value = entry.data[question.id];
        if (question.type === 'checkbox') {
            value = value ? 'Yes' : 'No';
        }
        detailsHtml += `<div class="mb-2"><strong>${question.text}:</strong> ${value}</div>`;
    });
    
    const entryDetailsEl = document.getElementById('entry-details');
    const viewModalEl = document.getElementById('view-modal');
    
    if (entryDetailsEl) entryDetailsEl.innerHTML = detailsHtml;
    if (viewModalEl) viewModalEl.classList.remove('hidden');
    
    initializeIcons();
}

function closeViewModal() {
    const viewModalEl = document.getElementById('view-modal');
    if (viewModalEl) viewModalEl.classList.add('hidden');
}

function deleteEntry(entryId) {
    if (confirm('Are you sure you want to delete this entry?')) {
        const scoutingData = getScoutingData();
        const filteredData = scoutingData.filter(e => e.id != entryId);
        
        if (saveScoutingData(filteredData)) {
            showMessage('Entry deleted successfully', 'success');
            loadDataPage();
        } else {
            showMessage('Failed to delete entry', 'error');
        }
    }
}
function exportCSV() {
    const scoutingData = getScoutingData();
    const questions = getQuestions();
    
    if (scoutingData.length === 0) {
        showMessage('No data to export', 'error');
        return;
    }
    
    const answeredQuestions = questions.filter(q => 
        scoutingData.some(entry => entry.data[q.id] !== undefined && entry.data[q.id] !== '')
    );
    
    const csvData = [
        ['Timestamp', ...answeredQuestions.map(q => q.text)],
        ...scoutingData.map(entry => [
            new Date(entry.timestamp).toISOString(),
            ...answeredQuestions.map(q => {
                const value = entry.data[q.id];
                if (q.type === 'checkbox') return value ? 'Yes' : 'No';
                return value || '';
            })
        ])
    ];
    
    const csvContent = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    downloadFile(csvContent, `ftc-scouting-data-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    showMessage('CSV exported successfully', 'success');
}
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}
function loadQuestionsPage() {
    const questions = getQuestions();
    renderQuestionsList(questions);
}

function renderQuestionsList(questions) {
    const questionsList = document.getElementById('questions-list');
    
    if (!questionsList) return; 
    
    let html = '';
    questions.forEach(question => {
        const typeLabel = {
            'text': 'Text Input',
            'number': 'Number',
            'select': 'Dropdown',
            'range': 'Range Slider',
            'checkbox': 'Checkbox',
        }[question.type] || question.type;
        
        html += `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">
                            ${question.text}
                            ${question.required ? '<span class="text-red-500 ml-1">*</span>' : ''}
                        </h4>
                        <p class="text-sm text-gray-500">
                            Type: ${typeLabel} | Category: ${question.category}
                        </p>
                        ${question.options ? `<p class="text-sm text-gray-500">Options: ${question.options.join(', ')}</p>` : ''}
                        ${question.type === 'range' ? `<p class="text-sm text-gray-500">Range: ${question.min || 1} - ${question.max || 10}</p>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editQuestion('${question.id}')" class="text-blue-600 hover:text-blue-800">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteQuestion('${question.id}')" class="text-red-600 hover:text-red-800">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    questionsList.innerHTML = html;
    initializeIcons();
}

function addQuestion(e) {
    e.preventDefault();
    
    const text = document.getElementById('question-text').value.trim();
    if (!text) {
        showMessage('Question text is required', 'error');
        return;
    }
    
    const type = document.getElementById('question-type').value;
    const category = document.getElementById('question-category').value;
    const required = document.getElementById('question-required').checked;
    
    const question = {
        id: generateId(),
        text,
        type,
        category,
        required
    };
    
    if (type === 'select') {
        const optionsText = document.getElementById('question-options').value;
        if (!optionsText.trim()) {
            showMessage('Options are required for dropdown questions', 'error');
            return;
        }
        question.options = optionsText.split(',').map(s => s.trim()).filter(s => s);
    }
    
    if (type === 'range') {
        question.min = parseInt(document.getElementById('range-min').value) || 1;
        question.max = parseInt(document.getElementById('range-max').value) || 10;
        
        if (question.min >= question.max) {
            showMessage('Max value must be greater than min value', 'error');
            return;
        }
    }
    
    const questions = getQuestions();
    questions.push(question);
    
    if (saveQuestions(questions)) {
        showMessage('Question added successfully', 'success');
        const form = document.getElementById('add-question-form');
        if (form) form.reset();
        
        const optionsContainer = document.getElementById('options-container');
        const rangeContainer = document.getElementById('range-container');
        if (optionsContainer) optionsContainer.classList.add('hidden');
        if (rangeContainer) rangeContainer.classList.add('hidden');
        
        loadQuestionsPage();
    } else {
        showMessage('Failed to add question', 'error');
    }
}

let editingQuestion = null;

function editQuestion(questionId) {
    const questions = getQuestions();
    const question = questions.find(q => q.id == questionId);
    
    if (!question) return;
    
    editingQuestion = question;
    
    const editTextEl = document.getElementById('edit-question-text');
    const editCategoryEl = document.getElementById('edit-question-category');
    const editRequiredEl = document.getElementById('edit-question-required');
    const editModalEl = document.getElementById('edit-modal');
    
    if (editTextEl) editTextEl.value = question.text;
    if (editCategoryEl) editCategoryEl.value = question.category;
    if (editRequiredEl) editRequiredEl.checked = question.required;
    if (editModalEl) editModalEl.classList.remove('hidden');
}

function updateQuestion(e) {
    e.preventDefault();
    
    if (!editingQuestion) return;
    
    const text = document.getElementById('edit-question-text').value.trim();
    const category = document.getElementById('edit-question-category').value;
    const required = document.getElementById('edit-question-required').checked;
    
    if (!text) {
        showMessage('Question text is required', 'error');
        return;
    }
    
    const questions = getQuestions();
    const questionIndex = questions.findIndex(q => q.id === editingQuestion.id);
    
    if (questionIndex !== -1) {
        questions[questionIndex] = {
            ...questions[questionIndex],
            text,
            category,
            required
        };
        
        if (saveQuestions(questions)) {
            showMessage('Question updated successfully', 'success');
            closeEditModal();
            loadQuestionsPage();
        } else {
            showMessage('Failed to update question', 'error');
        }
    }
}

function closeEditModal() {
    const editModalEl = document.getElementById('edit-modal');
    if (editModalEl) editModalEl.classList.add('hidden');
    editingQuestion = null;
}

function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question? This will also remove all associated data.')) {
        const questions = getQuestions();
        const filteredQuestions = questions.filter(q => q.id != questionId);
        
        if (saveQuestions(filteredQuestions)) {
            showMessage('Question deleted successfully', 'success');
            loadQuestionsPage();
        } else {
            showMessage('Failed to delete question', 'error');
        }
    }
}
