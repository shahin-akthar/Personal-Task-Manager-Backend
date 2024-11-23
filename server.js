const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const Database = require('better-sqlite3');


const database = new Database("task_manager.db", (error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Connected to SQLite database");

    database.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'Others',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  }
});


app.get('/get-tasks', (request, response) => {
  database.all('SELECT * FROM tasks', [], (error, rows) => {
    if (error) {
      response.status(400)
      response.json(error);
      return;
    }
    response.json(rows);
  });
  });

app.post("/create-tasks", (request, response) => {
  const { title, description, category } = request.body;
  const uuId = uuidv4();
  const query = `INSERT INTO tasks (id, title, description, category) VALUES (?, ?, ?, ?)`;
  const values = [uuId, title, description, category];

  database.run(query, values, function (error) {
    if (error) {
      console.error(error);
      response.status(400)
      response.json(error);
      return;
    }
    response.status(200)
    response.json('Task successfully created!');
    console.log(uuId)
  });
});


app.put("/update-task/:id", (request, response) => {
  const { id } = request.params;
  const { title, description, category } = request.body;

  const fields = [];
  const values = [];

  if (title !== undefined) {
    fields.push("title = ?");
    values.push(title); 
  }
  if (description !== undefined) {
    fields.push("description = ?");
    values.push(description);
  }
  if (category !== undefined) {
    fields.push("category = ?");
    values.push(category);
  }

  console.log('Received update for task ID:', id, 'with body:', request.body);

  if (fields.length === 0) {
    return response.status(400).json({ error: "No fields provided for update" });
  }

  database.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
    if (err || !row) {
      return response.status(404).json({ error: "Task not found" });
    }

    const query = `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    database.run(query, values, function (error) {
      if (error) {
        console.error("Database error:", error);
        return response.status(400).json({ error: error.message });
      }
      response.json({ message: 'Updated successfully', id });
    });
  });
});


app.delete("/delete-task/:id", (request, response) => {
  const { id } = request.params;
  console.log(id); 

  database.run("DELETE FROM tasks WHERE id = ?", id, function (error) {
    if (error) {
      console.error(error); 
      response.status(400);
      response.json(error);
      return 
    }

    response.status(200);
    response.json("Task deleted successfully");
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});