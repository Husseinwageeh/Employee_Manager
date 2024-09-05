const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs'); 
const mysql = require('mysql2');
const session = require('express-session');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/view');
})

//db connection
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root', 
  password: 'toor', 
  database: 'db_employees', 
  port: 3306
});

connection.connect((err) => {
if (err) {
  console.error('Error connecting to database:', err);
  return;
}
console.log('Connected to MySQL database');
});

//view all employees
app.get('/view', (req, res) => {
  connection.query('SELECT * FROM employees', (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Error fetching users' });
      return;
    }
    res.render('view', { employees: results });
  });

});


//add employee
app.get('/view/add', (req, res) => {
  res.render('add_edit',{ employee: null });
});

app.post('/view/add', (req, res) => {
  const { firstName, lastName, userName, password, email, phone } = req.body;

  // Check if username or email already exists
  const checkQuery = 'SELECT * FROM employees WHERE UserName = ? OR Email = ?';
  connection.query(checkQuery, [userName, email], (err, results) => {
      if (err) {
          console.error('Error checking data:', err);
          return res.status(500).json({ error: 'Error checking data' });
      }

      if (results.length > 0) {
          // Check which attribute is duplicated
          let message = '';
          if (results.some(e => e.UserName === userName)) {
              message = 'Username taken';
          } else if (results.some(e => e.Email === email)) {
              message = 'Email taken';
          }
          return res.status(400).send(message);
      }

      // Insert new employee if no duplicates found
      const insertQuery = 'INSERT INTO employees (FirstName, LastName, UserName, Password, Email, Phone) VALUES (?, ?, ?, ? , ?, ?)';
      connection.query(insertQuery, [firstName, lastName, userName, password, email, phone], (insertErr, insertResult) => {
          if (insertErr) {
              console.error('Error inserting data:', insertErr);
              return res.status(500).json({ error: 'Error inserting data' });
          }
          res.redirect('/view');
      });
  });
});


//edit form
app.get('/view/edit/:EmployeeID', (req, res) => {
  connection.query('SELECT * FROM employees WHERE EmployeeID = ?', [req.params.EmployeeID], (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Error fetching users' });
      return;
    }
    res.render('add_edit', { employee: results[0] });
  });
});


//update the data
app.post('/view/edit/:EmployeeID', (req, res) => {
  const { firstName, lastName, userName, password, email, phone} = req.body;
  connection.query(
    'UPDATE employees SET FirstName = ?, LastName = ?, UserName = ?, Password = ?, Email = ?, Phone = ? WHERE EmployeeID = ?',
    [firstName, lastName, userName, password, email, phone, req.params.EmployeeID],
    (err, result) => {
      if (err) {
        console.error('Error updating data:', err);
        res.status(500).json({ error: 'Error updating data' });
        return;
      }
      res.redirect('/view');
    }
  );
});

//delete
app.get('/view/delete/:EmployeeID', (req, res) => {
  connection.query('DELETE FROM employees WHERE EmployeeID = ?', [req.params.EmployeeID], (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Error fetching users' });
      return;
    }
    res.redirect('/view');
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
  console.log("http://localhost:3000");
});