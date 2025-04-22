require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const apiKey = 'AIzaSyB-kEDAzoqBlV-Ntii_XAamcN7Ha0EWJfI';

app.use(cors());
app.use(express.static('public'));

// Rota original para consulta simples
app.get('/api/places', async (req, res) => {
  const { cidade, tipo } = req.query;

  if (!cidade || !tipo) {
    return res.status(400).json({ error: 'Cidade e tipo são obrigatórios' });
  }

  const query = `${tipo} em ${cidade}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    console.log(`Resultados para ${tipo} em ${cidade}:`, response.data.results);
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar lugares:', error.message);
    res.status(500).json({ error: 'Erro ao consultar o Google Places API' });
  }
});

// Rota para gerar JSON estruturado no padrão de eventos
app.get('/api/eventos-json', async (req, res) => {
  const cidade = req.query.cidade || 'Recife';
  const tipos = ['bar', 'restaurant', 'night_club'];
  const eventos = [];

  for (const tipo of tipos) {
    const query = `${tipo} em ${cidade}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

    try {
      const response = await axios.get(url);
      const places = response.data.results;

      for (const place of places) {
        eventos.push({
          nome: place.name,
          local: place.name,
          endereco: place.formatted_address,
          cidade: cidade,
          estilo:
            tipo === 'night_club'
              ? 'Eletrônico / DJ Sets'
              : tipo === 'bar'
                ? 'Rock / Pop Rock'
                : 'MPB / Diversos',
          musica_ao_vivo: tipo !== 'night_club',
          horario: 'verificar',
          ingresso: 'verificar no local',
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        });
      }
    } catch (err) {
      console.error(`Erro ao buscar ${tipo}:`, err.message);
    }
  }

  res.json({
    data: new Date().toISOString().split('T')[0],
    eventos
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
