const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 3000;
const todosFile = path.join(__dirname, 'todos.json');

function loadTodos() {
  try {
    if (fs.existsSync(todosFile)) {
      const data = fs.readFileSync(todosFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading todos:', error);
  }
  return [];
}

function saveTodos(todos) {
  try {
    fs.writeFileSync(todosFile, JSON.stringify(todos, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving todos:', error);
    return false;
  }
}

function addTodo(text) {
  if (!text || text.trim() === '') {
    return { success: false, error: 'Todo text cannot be empty' };
  }
  
  const todos = loadTodos();
  const newTodo = {
    id: Date.now().toString(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  todos.push(newTodo);
  
  if (saveTodos(todos)) {
    return { success: true, todo: newTodo };
  } else {
    return { success: false, error: 'Failed to save todo' };
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (req.method === 'POST' && url.pathname === '/add-todo') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const result = addTodo(data.text);
        
        res.statusCode = result.success ? 201 : 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
  } else if (req.method === 'GET' && url.pathname === '/todos') {
    const todos = loadTodos();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(todos));
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Todo List App\n\nPOST /add-todo - Add a new todo\nGET /todos - Get all todos\n');
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});