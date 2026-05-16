const todos = [];
const RENDER_EVENT = 'render-todo-list-apps';

document.addEventListener('DOMContentLoaded', function () {
    const checkbox = document.getElementById('bookFormIsComplete');
    checkbox.addEventListener('change', function () {
        const span = document.querySelector('#bookFormSubmit span');
        if (checkbox.checked) {
            span.innerText = 'Selesai dibaca';
        } else {
            span.innerText = 'Belum selesai dibaca';
        }
    });

    const submitForm = document.getElementById('bookForm');
    submitForm.addEventListener('submit', function (event) {
        event.preventDefault();
        addTodo();
    });

    if (isStorageExist()) {
        loadDataFromStorage();
    }

    const editForm = document.getElementById('editForm');
    editForm.addEventListener('submit', function (event) {
        event.preventDefault();
        saveEditAction();
    });

    const cancelBtn = document.getElementById('cancelEdit');
    cancelBtn.addEventListener('click', () => {
        document.getElementById('editModal').style.display = 'none';
    });

    const searchForm = document.getElementById('searchBook');
    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const searchTitle = document.getElementById('searchBookTitle').value.toLowerCase();
        const bookItems = document.querySelectorAll('[data-testid="bookItem"]');

        for (const bookItem of bookItems) {
            const title = bookItem.querySelector('[data-testid="bookItemTitle"]').innerText.toLowerCase();
            if (title.includes(searchTitle)) {
                bookItem.style.display = 'block';
            } else {
                bookItem.style.display = 'none';
            }
        }
    });
});

function addTodo() {
    const formTitle = document.getElementById('bookFormTitle').value;
    const formAuthor = document.getElementById('bookFormAuthor').value;
    const formYear = Number(document.getElementById('bookFormYear').value);
    const formIsComplete = document.getElementById('bookFormIsComplete').checked;

    const generatedID = generateId();
    const todoObject = generateTodoObject(generatedID, formTitle, formAuthor, formYear, formIsComplete);
    todos.push(todoObject);

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function generateId() {
    return +new Date();
}

function generateTodoObject(id, title, author, year, isComplete) {
    return {
        id,
        title,
        author,
        year,
        isComplete
    }
}

document.addEventListener(RENDER_EVENT, function () {
    const uncompletedTODOList = document.getElementById('incompleteBookList');
    uncompletedTODOList.innerHTML = '';

    const completedTODOList = document.getElementById('completeBookList');
    completedTODOList.innerHTML = '';

    for (const todoItem of todos) {
        const todoElement = makeTodo(todoItem);
        if (!todoItem.isComplete) {
            uncompletedTODOList.append(todoElement);
        } else {
            completedTODOList.append(todoElement);
        }
    }
});

function makeTodo(todoObject) {
    const textTitle = document.createElement('h3');
    textTitle.setAttribute('data-testid', 'bookItemTitle');
    textTitle.innerText = todoObject.title;

    const textAuthor = document.createElement('p');
    textAuthor.setAttribute('data-testid', 'bookItemAuthor');
    textAuthor.innerText = `Penulis: ${todoObject.author}`;

    const textYear = document.createElement('p');
    textYear.setAttribute('data-testid', 'bookItemYear');
    textYear.innerText = `Tahun: ${todoObject.year}`;

    const isCompletedButton = document.createElement('button');
    isCompletedButton.setAttribute('data-testid', 'bookItemIsCompleteButton');

    const deleteButton = document.createElement('button');
    deleteButton.setAttribute('data-testid', 'bookItemDeleteButton');
    deleteButton.innerText = 'Hapus Buku';

    deleteButton.addEventListener('click', function () {
        openDeleteModal(todoObject.id);
    });

    const confirmDeleteBtn = document.getElementById('confirmDelete');
    confirmDeleteBtn.addEventListener('click', function () {
        if (bookIdToDelete !== null) {
            removeTaskFromCompleted(bookIdToDelete);
            bookIdToDelete = null;
            document.getElementById('deleteModal').style.display = 'none';
        }
    });

    const cancelDeleteBtn = document.getElementById('cancelDelete');
    cancelDeleteBtn.addEventListener('click', function () {
        bookIdToDelete = null;
        document.getElementById('deleteModal').style.display = 'none';
    });

    const editButton = document.createElement('button');
    editButton.setAttribute('data-testid', 'bookItemEditButton');
    editButton.innerText = 'Edit Buku';

    editButton.addEventListener('click', function () {
        editBook(todoObject.id);
    });

    const divContainer = document.createElement('div');
    divContainer.append(isCompletedButton, deleteButton, editButton);

    const container = document.createElement('div');
    container.setAttribute('data-bookid', `${todoObject.id}`);
    container.setAttribute('data-testid', 'bookItem');
    container.append(textTitle, textAuthor, textYear, divContainer);

    if (todoObject.isComplete) {
        isCompletedButton.innerText = 'Belum selesai dibaca';
        isCompletedButton.addEventListener('click', function () {
            undoTaskFromCompleted(todoObject.id);
        });
    } else {
        isCompletedButton.innerText = 'Selesai dibaca';
        isCompletedButton.addEventListener('click', function () {
            addTaskToCompleted(todoObject.id);
        });
    }

    return container;
}

function addTaskToCompleted(todoId) {
    const todoTarget = findTodo(todoId);

    if (todoTarget == null) return;

    todoTarget.isComplete = true;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function findTodo(todoId) {
    for (const todoItem of todos) {
        if (todoItem.id === todoId) {
            return todoItem;
        }
    }
    return null;
}

function removeTaskFromCompleted(todoId) {
    const todoTarget = findTodoIndex(todoId);

    if (todoTarget === -1) return;

    todos.splice(todoTarget, 1);
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}


function undoTaskFromCompleted(todoId) {
    const todoTarget = findTodo(todoId);

    if (todoTarget == null) return;

    todoTarget.isComplete = false;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function findTodoIndex(todoId) {
    for (const index in todos) {
        if (todos[index].id === todoId) {
            return index;
        }
    }

    return -1;
}

function saveData() {
    if (isStorageExist()) {
        const parsed = JSON.stringify(todos);
        localStorage.setItem(STORAGE_KEY, parsed);
        document.dispatchEvent(new Event(SAVED_EVENT));
    }
}

function editBook(todoId) {
    const todoTarget = findTodo(todoId);
    if (todoTarget == null) return;

    // Isi input modal dengan data buku yang dipilih
    document.getElementById('editBookId').value = todoTarget.id;
    document.getElementById('editBookTitle').value = todoTarget.title;
    document.getElementById('editBookAuthor').value = todoTarget.author;
    document.getElementById('editBookYear').value = todoTarget.year;

    // Tampilkan modal
    document.getElementById('editModal').style.display = 'flex';
}

function saveEditAction() {
    const bookId = Number(document.getElementById('editBookId').value);
    const todoTarget = findTodo(bookId);

    if (todoTarget != null) {
        todoTarget.title = document.getElementById('editBookTitle').value;
        todoTarget.author = document.getElementById('editBookAuthor').value;
        todoTarget.year = Number(document.getElementById('editBookYear').value);

        document.dispatchEvent(new Event(RENDER_EVENT));
        saveData();
        
        // Tutup modal
        document.getElementById('editModal').style.display = 'none';
    }
}

const SAVED_EVENT = 'saved-todo-list-apps';
const STORAGE_KEY = 'TODO_LIST_APPS';

function isStorageExist() {
    if (typeof (Storage) === undefined) {
        alert('Browser kamu tidak mendukung local storage');
        return false;
    }
    return true;
}

document.addEventListener(SAVED_EVENT, function () {
    console.log(localStorage.getItem(STORAGE_KEY));
});

function loadDataFromStorage() {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    let data = JSON.parse(serializedData);

    if (data !== null) {
        for (const todo of data) {
            todos.push(todo);
        }
    }

    document.dispatchEvent(new Event(RENDER_EVENT));
}


let bookIdToDelete = null;

function openDeleteModal(todoId) {
    const todoTarget = findTodo(todoId);
    if (todoTarget == null) return;

    bookIdToDelete = todoId;
    document.getElementById('deleteBookTitleText').innerText = todoTarget.title;
    document.getElementById('deleteModal').style.display = 'flex';
}
