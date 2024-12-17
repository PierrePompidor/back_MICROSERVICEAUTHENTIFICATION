const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const secretKey = 'Voici ma clef';

var connection;
try {
    mysql.createConnection({  // ou createPool()
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'ECOMMERCE'})
    .then((connect) => {
      console.log("Connexion à la base de données");
      connection = connect;
    });
} catch (error) {
  console.error('Erreur de connexion à la base de données :', error.message);
}

app.post('/signup', async (req, res) => {
  const { email, password, nom, prénom, civilité } = req.body;
  console.log("/Signup avec %s %s %s %s %s", email, password, nom, prénom, civilité);
  try {
    /* let SQL = `SELECT * FROM user WHERE email='${email}'`;
    console.log(SQL); */
    const [rows] = await connection.execute('SELECT * FROM user WHERE email=?', [email]);
    if (rows.length !== 0) {
       return res.status(401).json({ message: 'Email déjà utilisé' });
    }
      const hashedPassword = await bcrypt.hash(password, 10);
    /*SQL = `INSERT INTO user (email, password, nom, prénom, civilité) VALUES ('${email}', '${hashedPassword}', '${nom}', '${prénom}', '${civilité}')`;
    console.log(SQL);*/
    const [result] = await connection.query('INSERT INTO user (email, password, nom, prénom, civilité) VALUES (?, ?, ?, ?, ?)', [email, hashedPassword, nom, prénom, civilité]);
    const token = jwt.sign({ userId: email }, secretKey, { expiresIn: '1h' });
    res.status(201).json({ message: 'Utilisateur enregistré avec succès', userId: user.mail, token: token });
  } catch (error) {
    console.error(error);
     res.status(500).json({ message: "Erreur lors de l'enregistrement de l\'utilisateur" });
  }
});
  
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  console.log("/signin avec %s %s", email, password)
  try {
    const [rows] = await connection.query('SELECT * FROM user WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    const token = jwt.sign({ userId: user.email }, secretKey, { expiresIn: '1h' });
    console.log("Renvoi du token");
    res.status(200).json({ message: 'Utilisateur authentifié avec succès', userId: user.email, token: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/validate-token', (req, res) => {
  const { token } = req.body;
  console.log("/validate-token avec", token);
  if (!token) {
    return res.status(401).json({ message: 'Aucun token fourni' });
  } 
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.log("Erreur :", err);
      return res.status(403).json({ message: 'Token invalide' });
    }
    console.log("Token décodé :", decoded);
    res.status(200).json({ message: 'Token valide', userId: decoded.userId });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Micro-service d'authentification en écoute sur le port ${PORT}`);
});