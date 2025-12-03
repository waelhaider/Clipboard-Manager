// State
let boards = [];
let notes = [];
let trash = [];
let activeBoardId = '1';
let inputText = '';
let searchQuery = '';
let sortOrder = 'timestamp-desc'; // timestamp-desc, timestamp-asc, content-asc
let isSidebarOpen = false;
let isBoardsExpanded = true;
let expandedNoteIds = new Set(); // For text expansion
let openMenuId = null; // For menu and highlight
let fontSize = 14; // Default font size in px
let modal = { type: 'NONE', data: null };
let toastMessage = '';

// Language map for translation
const languageMap = {
    'Arabic': 'ar',
    'English': 'en',
    'French': 'fr',
    'Spanish': 'es',
    'German': 'de',
    'auto': 'auto'
};

// DOM Elements
const elements = {};

// Initialize DOM elements
function initElements() {
    elements.toast = document.getElementById('toast');
    elements.toastMessage = document.getElementById('toast-message');
    elements.sidebar = document.getElementById('sidebar');
    elements.sidebarOverlay = document.getElementById('sidebar-overlay');
    elements.boardsNav = document.getElementById('boards-nav');
    elements.boardsList = document.getElementById('boards-list');
    elements.notesList = document.getElementById('notes-list');
    elements.noteForm = document.getElementById('note-form');
    elements.noteInput = document.getElementById('note-input');
    elements.searchInput = document.getElementById('search-input');
    elements.boardModal = document.getElementById('board-modal');
    elements.boardForm = document.getElementById('board-form');
    elements.boardInput = document.getElementById('board-input');
    elements.deleteBoardModal = document.getElementById('delete-board-modal');
    elements.reorderModal = document.getElementById('reorder-modal');
    elements.trashModal = document.getElementById('trash-modal');
    elements.moveModal = document.getElementById('move-modal');
    elements.editNoteModal = document.getElementById('edit-note-modal');
    elements.translateModal = document.getElementById('translate-modal');
    elements.originalText = document.getElementById('original-text');
    elements.translatedText = document.getElementById('translated-text');
    elements.sourceLang = document.getElementById('source-lang');
    elements.targetLang = document.getElementById('target-lang');
}

// Load data from localStorage
function loadData() {
    try {
        const savedBoards = localStorage.getItem('app_boards');
        if (savedBoards) boards = JSON.parse(savedBoards);
        else boards = [
            { id: '1', name: 'عام', order: 0 },
            { id: '2', name: 'شخصي', order: 1 },
            { id: '3', name: 'عمل', order: 2 }
        ];

        const savedNotes = localStorage.getItem('app_notes');
        notes = savedNotes ? JSON.parse(savedNotes) : [];

        const savedTrash = localStorage.getItem('app_trash');
        trash = savedTrash ? JSON.parse(savedTrash) : [];
    } catch (e) {
        console.error('Failed to load data', e);
        boards = [
            { id: '1', name: 'عام', order: 0 },
            { id: '2', name: 'شخصي', order: 1 },
            { id: '3', name: 'عمل', order: 2 }
        ];
        notes = [];
        trash = [];
    }

    // Ensure activeBoardId is valid
    if (!boards.find(b => b.id === activeBoardId)) {
        activeBoardId = boards[0]?.id || '1';
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('app_boards', JSON.stringify(boards));
    localStorage.setItem('app_notes', JSON.stringify(notes));
    localStorage.setItem('app_trash', JSON.stringify(trash));
}

// Show toast
function showToast(message) {
    toastMessage = message;
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Translation function
async function translateText(text, sourceLang, targetLang) {
    if (!text.trim()) return '';

    try {
        const sourceCode = languageMap[sourceLang] || sourceLang;
        const targetCode = languageMap[targetLang] || targetLang;
        const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceCode}&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Translation failed');

        const data = await response.json();
        let translatedText = '';
        if (data && data[0]) {
            for (let i = 0; i < data[0].length; i++) {
                if (data[0][i] && data[0][i][0]) {
                    translatedText += data[0][i][0];
                }
            }
        }
        return translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        return 'خطأ: لا يمكن الترجمة بدون إتصال أنترنت.';
    }
}

// Render boards navigation
function renderBoardsNav() {
    const sortedBoards = [...boards].sort((a, b) => a.order - b.order);
    elements.boardsNav.innerHTML = '';

    sortedBoards.forEach(board => {
        const btn = document.createElement('button');
        btn.className = `board-btn ${board.id === activeBoardId ? 'active' : ''}`;
        btn.textContent = board.name;
        btn.onclick = () => {
            activeBoardId = board.id;
            renderBoardsNav();
            renderNotes();
        };
        elements.boardsNav.appendChild(btn);
    });
}

// Render boards list in sidebar
function renderBoardsList() {
    const sortedBoards = [...boards].sort((a, b) => a.order - b.order);
    elements.boardsList.innerHTML = '';

    sortedBoards.forEach(board => {
        const item = document.createElement('div');
        item.className = 'board-item';

        const name = document.createElement('span');
        name.className = 'board-name';
        name.textContent = board.name;

        const actions = document.createElement('div');
        actions.className = 'board-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'board-action edit';
        editBtn.innerHTML = '✏';
        editBtn.onclick = () => openModal('EDIT_BOARD_NAME', board);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'board-action delete';
        deleteBtn.innerHTML = '🗑';
        deleteBtn.onclick = () => openModal('DELETE_BOARD', board);

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        item.appendChild(name);
        item.appendChild(actions);
        elements.boardsList.appendChild(item);
    });
}

// Render notes
function renderNotes() {
    let filteredNotes = notes
        .filter(note => note.boardId === activeBoardId)
        .filter(note => note.content.toLowerCase().includes(searchQuery.toLowerCase()));

    // Sort based on sortOrder
    if (sortOrder === 'timestamp-desc') {
        filteredNotes = filteredNotes.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortOrder === 'timestamp-asc') {
        filteredNotes = filteredNotes.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortOrder === 'content-asc') {
        filteredNotes = filteredNotes.sort((a, b) => a.content.localeCompare(b.content));
    }

    elements.notesList.innerHTML = '';

    if (filteredNotes.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-notes';
        empty.textContent = 'لا توجد ملاحظات في هذه اللوحة';
        elements.notesList.appendChild(empty);
        return;
    }

    filteredNotes.forEach(note => {
        const item = document.createElement('div');
        item.className = `note-item ${expandedNoteIds.has(note.id) ? 'active' : ''} ${note.id === openMenuId ? 'menu-open' : ''}`;

        const content = document.createElement('div');
        content.className = 'note-content';

        const text = document.createElement('p');
        text.className = 'note-text';
        text.textContent = note.content;
        // Set text direction
        const isArabic = /\p{Script=Arabic}/u.test(note.content);
        text.dir = isArabic ? 'rtl' : 'ltr';

        const meta = document.createElement('div');
        meta.className = 'note-meta';

        const date = document.createElement('span');
        date.className = 'note-date';
        date.textContent = new Date(note.timestamp).toLocaleDateString('ar-EG', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        meta.appendChild(date);
        content.appendChild(text);
        content.appendChild(meta);

        const actions = document.createElement('div');
        actions.className = 'note-actions';

        const menuBtn = document.createElement('button');
        menuBtn.className = 'note-action menu-btn';
        menuBtn.innerHTML = '⁝';
        menuBtn.onclick = (e) => {
            e.stopPropagation();
            toggleNoteMenu(note.id, actions);
        };

        const menu = document.createElement('div');
        menu.className = 'note-menu';
        menu.id = `menu-${note.id}`;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'menu-item';
        copyBtn.innerHTML = '🧮';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(note.content);
            showToast('تم نسخ النص');
            hideNoteMenu(note.id);
        };

        const editBtn = document.createElement('button');
        editBtn.className = 'menu-item';
        editBtn.innerHTML = '✏️';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            openModal('EDIT_NOTE', note);
            hideNoteMenu(note.id);
        };

        const moveBtn = document.createElement('button');
        moveBtn.className = 'menu-item';
        moveBtn.innerHTML = '📩';
        moveBtn.onclick = (e) => {
            e.stopPropagation();
            openModal('MOVE_TO', note);
            hideNoteMenu(note.id);
        };

        const translateBtn = document.createElement('button');
        translateBtn.className = 'menu-item';
        translateBtn.innerHTML = '🌐';
        translateBtn.onclick = (e) => {
            e.stopPropagation();
            openModal('TRANSLATE', note);
            hideNoteMenu(note.id);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'menu-item delete';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
                deleteNote(note);
            }
            hideNoteMenu(note.id);
        };

        menu.appendChild(copyBtn);
        menu.appendChild(editBtn);
        menu.appendChild(moveBtn);
        menu.appendChild(translateBtn);
        menu.appendChild(deleteBtn);

        if (note.id === openMenuId) {
            menu.classList.add('show');
        }

        actions.appendChild(menuBtn);
        actions.appendChild(menu);

        item.appendChild(content);
        item.appendChild(actions);

        item.onclick = () => {
            if (expandedNoteIds.has(note.id)) {
                expandedNoteIds.delete(note.id);
            } else {
                expandedNoteIds.add(note.id);
            }
            renderNotes();
        };

        elements.notesList.appendChild(item);
    });
}

// Modal functions
function openModal(type, data = null) {
    modal = { type, data };
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    switch (type) {
        case 'ADD_BOARD':
        case 'EDIT_BOARD_NAME':
            elements.boardModal.classList.add('show');
            document.getElementById('board-modal-title').textContent =
                type === 'ADD_BOARD' ? 'إضافة لوحة جديدة' : 'تعديل اسم اللوحة';
            elements.boardInput.value = data ? data.name : '';
            break;
        case 'DELETE_BOARD':
            elements.deleteBoardModal.classList.add('show');
            break;
        case 'REORDER':
            renderReorderModal();
            elements.reorderModal.classList.add('show');
            break;
        case 'TRASH':
            renderTrashModal();
            elements.trashModal.classList.add('show');
            break;
        case 'MOVE_TO':
            renderMoveModal(data);
            elements.moveModal.classList.add('show');
            break;
        case 'EDIT_NOTE':
            elements.editNoteModal.classList.add('show', 'top-modal');
            document.getElementById('edit-note-textarea').value = data.content;
            // Set text direction
            const isArabic = /\p{Script=Arabic}/u.test(data.content);
            document.getElementById('edit-note-textarea').dir = isArabic ? 'rtl' : 'ltr';
            // Keep the note expanded during editing
            expandedNoteIds.add(data.id);
            renderNotes();
            break;
        case 'TRANSLATE':
            elements.translateModal.classList.add('show', 'top-modal');
            elements.originalText.value = data.content;
            elements.translatedText.value = '';
            // Trigger translation
            elements.originalText.dispatchEvent(new Event('input'));
            break;
    }
}

function closeModal() {
    modal = { type: 'NONE', data: null };
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show', 'top-modal'));
    document.body.style.overflow = ''; // Restore scroll
}

// Specific modal renders
function renderReorderModal() {
    const list = document.getElementById('reorder-list');
    list.innerHTML = '';
    const sortedBoards = [...boards].sort((a, b) => a.order - b.order);

    sortedBoards.forEach((board, index) => {
        const item = document.createElement('div');
        item.className = 'reorder-item';

        const name = document.createElement('span');
        name.className = 'reorder-name';
        name.textContent = board.name;

        const actions = document.createElement('div');
        actions.className = 'reorder-actions';

        const upBtn = document.createElement('button');
        upBtn.className = 'reorder-btn';
        upBtn.innerHTML = '↑';
        upBtn.disabled = index === 0;
        upBtn.onclick = () => reorderBoard(board.id, -1);

        const downBtn = document.createElement('button');
        downBtn.className = 'reorder-btn';
        downBtn.innerHTML = '↓';
        downBtn.disabled = index === sortedBoards.length - 1;
        downBtn.onclick = () => reorderBoard(board.id, 1);

        actions.appendChild(upBtn);
        actions.appendChild(downBtn);
        item.appendChild(name);
        item.appendChild(actions);
        list.appendChild(item);
    });
}

function renderTrashModal() {
    const list = document.getElementById('trash-list');
    list.innerHTML = '';

    if (trash.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">سلة المحذوفات فارغة</p>';
        return;
    }

    trash.forEach(item => {
        const trashItem = document.createElement('div');
        trashItem.className = 'trash-item';

        const text = document.createElement('p');
        text.className = 'trash-text';
        text.textContent = item.content;

        const meta = document.createElement('div');
        meta.className = 'trash-meta';

        const board = document.createElement('span');
        board.textContent = `من: ${item.originalBoardName}`;

        const restore = document.createElement('button');
        restore.className = 'restore-btn';
        restore.textContent = 'استعادة هنا';
        restore.onclick = () => restoreNote(item);

        meta.appendChild(board);
        meta.appendChild(restore);
        trashItem.appendChild(text);
        trashItem.appendChild(meta);
        list.appendChild(trashItem);
    });
}

function renderMoveModal(note) {
    const options = document.getElementById('move-options');
    options.innerHTML = '';

    boards.filter(b => b.id !== note.boardId).forEach(board => {
        const option = document.createElement('button');
        option.className = 'move-option';
        option.textContent = board.name;
        option.onclick = () => moveNote(note, board.id);
        options.appendChild(option);
    });
}

// Actions
function handleSaveNote() {
    if (!inputText.trim()) return;

    const newNote = {
        id: crypto.randomUUID(),
        boardId: activeBoardId,
        content: inputText,
        timestamp: Date.now()
    };

    notes = [newNote, ...notes];
    inputText = '';
    elements.noteInput.value = '';
    elements.noteInput.style.height = 'auto'; // Reset height
    saveData();
    renderNotes();
    showToast('تم الحفظ بنجاح');
}

function deleteNote(note) {
    const trashItem = {
        ...note,
        deletedAt: Date.now(),
        originalBoardName: boards.find(b => b.id === note.boardId)?.name || 'Unknown'
    };
    trash = [trashItem, ...trash];
    notes = notes.filter(n => n.id !== note.id);
    saveData();
    renderNotes();
    showToast('نقلت للمحذوفات');
}

function restoreNote(item) {
    const restoredNote = {
        id: item.id,
        boardId: activeBoardId,
        content: item.content,
        timestamp: item.timestamp
    };
    notes = [restoredNote, ...notes];
    trash = trash.filter(t => t.id !== item.id);
    saveData();
    renderTrashModal();
    renderNotes();
    showToast('تمت الاستعادة');
}

function moveNote(note, newBoardId) {
    notes = notes.map(n => n.id === note.id ? { ...n, boardId: newBoardId } : n);
    saveData();
    renderNotes();
    closeModal();
    showToast(`نقلت إلى ${boards.find(b => b.id === newBoardId)?.name}`);
}

function reorderBoard(boardId, direction) {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    const sortedBoards = [...boards].sort((a, b) => a.order - b.order);
    const index = sortedBoards.findIndex(b => b.id === boardId);
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= sortedBoards.length) return;

    const temp = sortedBoards[index].order;
    sortedBoards[index].order = sortedBoards[targetIndex].order;
    sortedBoards[targetIndex].order = temp;

    boards = sortedBoards;
    saveData();
    renderReorderModal();
    renderBoardsNav();
}

function handleBoardSubmit(e) {
    e.preventDefault();
    const name = elements.boardInput.value.trim();
    if (!name) return;

    if (modal.type === 'ADD_BOARD') {
        const newBoard = {
            id: crypto.randomUUID(),
            name,
            order: boards.length
        };
        boards = [...boards, newBoard];
        activeBoardId = newBoard.id;
        showToast('تمت الإضافة');
    } else if (modal.type === 'EDIT_BOARD_NAME') {
        boards = boards.map(b => b.id === modal.data.id ? { ...b, name } : b);
        showToast('تم التعديل');
    }

    saveData();
    renderBoardsNav();
    renderBoardsList();
    closeModal();
}

function handleBoardDelete() {
    const board = boards.find(b => b.id === modal.data.id);
    if (!board) return;

    const boardNotes = notes.filter(n => n.boardId === board.id);
    const trashNotes = boardNotes.map(n => ({
        ...n,
        deletedAt: Date.now(),
        originalBoardName: board.name
    }));

    trash = [...trash, ...trashNotes];
    notes = notes.filter(n => n.boardId !== board.id);
    boards = boards.filter(b => b.id !== board.id);

    if (activeBoardId === board.id) {
        activeBoardId = boards[0]?.id || '';
    }

    saveData();
    renderBoardsNav();
    renderBoardsList();
    renderNotes();
    closeModal();
    showToast('تم حذف اللوحة');
}

function handleEditSave() {
    const content = document.getElementById('edit-note-textarea').value;
    notes = notes.map(n => n.id === modal.data.id ? { ...n, content } : n);
    expandedNoteIds.add(modal.data.id);
    saveData();
    renderNotes();
    closeModal();
    showToast('تم التحديث');
}

function handleExport() {
    const data = JSON.stringify({ boards, notes, trash }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const filename = `manager-backup-${new Date().toISOString().slice(0,10)}.json`;

    const downloadFallback = () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('تم التصدير (المجلد الافتراضي)');
    };

    if ('showSaveFilePicker' in window) {
        try {
            const handle = window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'JSON Backup File',
                    accept: { 'application/json': ['.json'] },
                }],
            }).then(handle => {
                return handle.createWritable();
            }).then(writable => {
                writable.write(blob);
                writable.close();
                showToast('تم حفظ النسخة بنجاح');
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn("showSaveFilePicker failed, using fallback", err);
                downloadFallback();
            }
        }
    } else {
        alert('متصفحك لا يدعم نافذة اختيار مكان الحفظ، سيتم التنزيل في المجلد الافتراضي للمتصفح.');
        downloadFallback();
    }
}

function handleExportBoard() {
    const activeBoard = boards.find(b => b.id === activeBoardId);
    if (!activeBoard) return;

    const boardNotes = notes.filter(n => n.boardId === activeBoardId);
    const data = JSON.stringify({ board: activeBoard, notes: boardNotes }, null, 2);
    const filename = `${activeBoard.name}-manager-backup-.json`;

    const downloadFallback = () => {
        const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('تم تصدير اللوحة');
    };

    if ('showSaveFilePicker' in window) {
        try {
            const handle = window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'Board Backup File',
                    accept: { 'application/json': ['.json'] },
                }],
            }).then(handle => {
                return handle.createWritable();
            }).then(writable => {
                writable.write(new Blob([data], { type: 'application/json' }));
                writable.close();
                showToast('تم حفظ اللوحة بنجاح');
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn("showSaveFilePicker failed, using fallback", err);
                downloadFallback();
            }
        }
    } else {
        downloadFallback();
    }
}

function handleImportBoard(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.board && data.notes) {
                const newBoardId = crypto.randomUUID();
                const importedBoard = { ...data.board, id: newBoardId };
                const importedNotes = data.notes.map(n => ({ ...n, boardId: newBoardId }));

                boards.push(importedBoard);
                notes.push(...importedNotes);

                activeBoardId = newBoardId;
                saveData();
                renderBoardsNav();
                renderBoardsList();
                renderNotes();
                showToast('تم استيراد اللوحة بنجاح');
            } else {
                alert('ملف غير صالح لاستيراد لوحة.');
            }
        } catch (err) {
            alert('فشل الاستيراد، ملف غير صالح.');
        }
    };
    reader.readAsText(file);
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            let importedBoards = data.boards;
            let importedNotes = data.notes;
            if (data.board) {
                // Handle old format with single board
                importedBoards = [data.board];
                importedNotes = data.notes;
            }
            if (importedBoards && importedNotes) {
                if (confirm('هل أنت متأكد؟ سيتم استبدال البيانات الحالية بالبيانات المستوردة.')) {
                    boards = importedBoards;
                    notes = importedNotes;
                    trash = data.trash || [];
                    saveData();
                    renderBoardsNav();
                    renderBoardsList();
                    renderNotes();
                    showToast('تم الاستيراد بنجاح');
                }
            } else {
                alert('ملف غير صالح، يجب أن يحتوي على boards و notes.');
            }
        } catch (err) {
            alert('فشل الاستيراد، ملف غير صالح.');
        }
    };
    reader.readAsText(file);
}

// Event listeners
function initEventListeners() {
    // Sidebar
    document.getElementById('open-sidebar').onclick = () => {
        isSidebarOpen = true;
        elements.sidebar.classList.add('show');
        elements.sidebarOverlay.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    };

    document.getElementById('close-sidebar').onclick = () => {
        isSidebarOpen = false;
        elements.sidebar.classList.remove('show');
        elements.sidebarOverlay.classList.remove('show');
        document.body.style.overflow = ''; // Restore scroll
    };

    elements.sidebarOverlay.onclick = () => {
        isSidebarOpen = false;
        elements.sidebar.classList.remove('show');
        elements.sidebarOverlay.classList.remove('show');
        document.body.style.overflow = ''; // Restore scroll
    };

    // Boards toggle
    document.getElementById('boards-toggle').onclick = () => {
        isBoardsExpanded = !isBoardsExpanded;
        document.getElementById('boards-chevron').textContent = isBoardsExpanded ? '▼' : '▶';
        elements.boardsList.style.display = isBoardsExpanded ? 'block' : 'none';
    };

    // Sidebar buttons
    document.getElementById('add-board-btn').onclick = () => openModal('ADD_BOARD');
    document.getElementById('reorder-boards-btn').onclick = () => openModal('REORDER');
    document.getElementById('export-btn').onclick = handleExport;
    document.getElementById('export-board-btn').onclick = handleExportBoard;
    document.getElementById('import-btn').onclick = () => document.getElementById('import-file').click();
    document.getElementById('import-board-btn').onclick = () => document.getElementById('import-board-file').click();
    document.getElementById('trash-btn').onclick = () => openModal('TRASH');
    document.getElementById('font-size-btn').onclick = () => openFontSizeModal();

    // Form
    elements.noteForm.onsubmit = (e) => {
        e.preventDefault();
        inputText = elements.noteInput.value;
        handleSaveNote();
    };

    elements.noteInput.oninput = (e) => {
        inputText = e.target.value;
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    // Search
    elements.searchInput.oninput = (e) => {
        searchQuery = e.target.value;
        renderNotes();
    };

    // Filter/Sort
    document.querySelector('.filter-btn').onclick = () => {
        if (sortOrder === 'timestamp-desc') {
            sortOrder = 'timestamp-asc';
        } else if (sortOrder === 'timestamp-asc') {
            sortOrder = 'content-asc';
        } else {
            sortOrder = 'timestamp-desc';
        }
        renderNotes();
        showToast(`تم الترتيب: ${sortOrder === 'timestamp-desc' ? 'الأحدث أولاً' : sortOrder === 'timestamp-asc' ? 'الأقدم أولاً' : 'أبجدي'}`);
    };

    // Modals
    elements.boardForm.onsubmit = handleBoardSubmit;
    document.getElementById('cancel-board').onclick = closeModal;
    document.getElementById('confirm-delete-board').onclick = handleBoardDelete;
    document.getElementById('cancel-delete-board').onclick = closeModal;
    document.getElementById('close-reorder').onclick = closeModal;
    document.getElementById('close-trash').onclick = closeModal;
    document.getElementById('cancel-move').onclick = closeModal;
    document.getElementById('save-edit').onclick = handleEditSave;
    document.getElementById('cancel-edit').onclick = closeModal;
    document.getElementById('close-edit').onclick = closeModal;
    document.getElementById('close-translate').onclick = closeModal;

    // Import file
    document.getElementById('import-file').onchange = handleImport;
    document.getElementById('import-board-file').onchange = handleImportBoard;

    // Translation
    let translateTimeout;
    elements.originalText.oninput = () => {
        clearTimeout(translateTimeout);
        translateTimeout = setTimeout(async () => {
            const text = elements.originalText.value;
            if (!text.trim()) return;

            // Auto-detect language
            const isArabic = /\p{Script=Arabic}/u.test(text);
            const sourceLang = isArabic ? 'Arabic' : 'English';
            const targetLang = isArabic ? 'English' : 'Arabic';

            // Update selects
            elements.sourceLang.value = sourceLang;
            elements.targetLang.value = targetLang;

            // Set text direction
            elements.originalText.dir = isArabic ? 'rtl' : 'ltr';
            elements.translatedText.dir = isArabic ? 'ltr' : 'rtl';

            const result = await translateText(text, sourceLang, targetLang);
            elements.translatedText.value = result;
        }, 500); // Faster, 0.5s
    };

    document.getElementById('swap-langs').onclick = () => {
        const temp = elements.sourceLang.value;
        elements.sourceLang.value = elements.targetLang.value;
        elements.targetLang.value = temp;
        const tempText = elements.originalText.value;
        elements.originalText.value = elements.translatedText.value;
        elements.translatedText.value = tempText;

        // Update directions based on new original text
        const isArabic = /\p{Script=Arabic}/u.test(elements.originalText.value);
        elements.originalText.dir = isArabic ? 'rtl' : 'ltr';
        elements.translatedText.dir = isArabic ? 'ltr' : 'rtl';
    };

    document.getElementById('copy-original').onclick = () => {
        navigator.clipboard.writeText(elements.originalText.value);
        showToast('تم النسخ');
    };

    document.getElementById('copy-translated').onclick = () => {
        navigator.clipboard.writeText(elements.translatedText.value);
        showToast('تم النسخ');
    };

    document.getElementById('save-edit-translate').onclick = () => {
        const newContent = elements.originalText.value;
        notes = notes.map(n => n.id === modal.data.id ? { ...n, content: newContent } : n);
        saveData();
        renderNotes();
        closeModal();
        showToast('تم حفظ التعديل');
    };

    elements.sourceLang.onchange = () => {
        const text = elements.originalText.value;
        if (!text.trim()) return;
        translateTimeout = setTimeout(async () => {
            const result = await translateText(text, elements.sourceLang.value, elements.targetLang.value);
            elements.translatedText.value = result;
        }, 500);
    };
    elements.targetLang.onchange = () => {
        const text = elements.originalText.value;
        if (!text.trim()) return;
        translateTimeout = setTimeout(async () => {
            const result = await translateText(text, elements.sourceLang.value, elements.targetLang.value);
            elements.translatedText.value = result;
        }, 500);
    };
}

// Back to top functionality
function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    backToTopBtn.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('scroll', () => {
        if (window.scrollY > 250) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
}

// Initialize app
function init() {
    initElements();
    loadData();
    renderBoardsNav();
    renderBoardsList();
    renderNotes();
    initEventListeners();
    initBackToTop();
    updateFontSize(); // Apply font size
}

// Note menu functions
function toggleNoteMenu(noteId, actions) {
    if (openMenuId === noteId) {
        openMenuId = null;
    } else {
        openMenuId = noteId;
    }
    renderNotes();
}

function hideNoteMenu(noteId) {
    openMenuId = null;
    renderNotes();
}

// Font size modal
function openFontSizeModal() {
    document.getElementById('current-font-size').textContent = fontSize + 'px';
    document.getElementById('font-size-modal').classList.add('show');
}

function updateFontSize() {
    document.documentElement.style.setProperty('--font-size', fontSize + 'px');
    document.getElementById('current-font-size').textContent = fontSize + 'px';
    localStorage.setItem('app_font_size', fontSize.toString());
}

// Load font size
function loadFontSize() {
    const saved = localStorage.getItem('app_font_size');
    if (saved) {
        fontSize = parseInt(saved, 10);
        updateFontSize();
    }
}

// Event listeners for font size
document.getElementById('decrease-font').onclick = () => {
    if (fontSize > 10) {
        fontSize--;
        updateFontSize();
    }
};

document.getElementById('increase-font').onclick = () => {
    if (fontSize < 30) {
        fontSize++;
        updateFontSize();
    }
};

document.getElementById('close-font-size').onclick = () => {
    document.getElementById('font-size-modal').classList.remove('show');
};

// Hide menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.note-actions')) {
        document.querySelectorAll('.note-menu').forEach(m => m.classList.remove('show'));
    }
});

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    loadFontSize();
    init();
});