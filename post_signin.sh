resultat=$(curl -X POST -H "Content-Type: application/json" -d '{"email": "pompidor@lirmm.fr", "password": "motdepasse123"}' http://localhost:8888/signin)
echo $resultat
