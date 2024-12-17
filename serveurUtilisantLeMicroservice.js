const express = require('express');
const app = express();
const axios = require('axios');
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(cookieParser());
const cookieOptions = {
    maxAge: 60000*60, // Durée de vie du cookie en millisecondes (une heure dans cet exemple)
    httpOnly: true, // Le cookie est accessible uniquement via HTTP(S), pas via JavaScript
    sameSite: 'strict' // Le cookie ne sera envoyé que pour les requêtes provenant du même site
};
// Il faudrait rajouter "secure" pour obliger que le cookie soit crypté (https)

const PORT = 8888;
app.listen(PORT, () => {
  console.log(`Serveur de test du microservice d'authentification ${PORT}`);
});

const authMiddleware = async (req, res, next) => {
  //const token = req.headers.authorization?.split(' ')[1]; utilisation d'un cookie à la place
  var token = '';
  if (req.cookies.jwt) {
    console.log('Cookie JWT.jwt :', req.cookies);
    token = req.cookies.jwt;
  }
  if (!token) {
    return res.status(401).json({ message: 'Aucun token fourni' });
  }
  try {
    const response = await axios.post('http://localhost:3000/validate-token', { token });
    if (response.status == 200) {
      console.log("Token valide");
      req.userId = response.data.userId;
      next();
    } else {
      res.status(401).json({ message: 'Token invalide' });
    }
  } catch (error) {
    console.log("Erreur :", error);
    res.status(500).json({ message: 'Erreur lors de la validation du token' });
  }
};

app.get('/', (req, res) => {
    console.log('/');
    res.sendFile('clientPourAuthentification.html', {root: __dirname});
});

app.get('/action', authMiddleware, (req, res) => {
    console.log('/action');
    res.json({ message: 'Token valide', userId: req.userId });
});

app.post('/signup', async (req, res) => {
    console.log('/signup');
    const response = await axios.post('http://localhost:3000/signup', req.body);
    res.cookie('jwt', response.data.token, cookieOptions);
    res.status(response.status).json({message:response.data.message, userId:response.data.userId});
});
  
app.post('/signin', async (req, res) => {
    console.log('/signin avec', req.body);
    const response = await axios.post('http://localhost:3000/signin', req.body);
    res.cookie('jwt', response.data.token, cookieOptions);
    res.status(response.status).json({message:response.data.message, userId:response.data.userId});
});

app.get('/signout', async (req, res) => {
  console.log('/signout');
  res.clearCookie('jwt');
  res.status(200).json({message:"Cookie supprimé"});
});
  