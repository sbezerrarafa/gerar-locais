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
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=pt-BR`;

  try {
    const response = await axios.get(url);
    const resultados = response.data.results;

    const detalhados = [];

    for (const item of resultados) {
      const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&fields=name,formatted_address,geometry,opening_hours,editorial_summary&key=${apiKey}&language=pt-BR`;


      const detailRes = await axios.get(detailUrl);
      const detalhe = detailRes.data.result;

      detalhados.push({
        name: detalhe.name,
        formatted_address: detalhe.formatted_address,
        geometry: detalhe.geometry,
        opening_hours: detalhe.opening_hours,
        place_id: item.place_id,
        rating: item.rating,
        user_ratings_total: item.user_ratings_total,
        descricao: detalhe.editorial_summary?.overview || `${detalhe.name}, localizado em ${detalhe.formatted_address}.`
      });

      await new Promise(r => setTimeout(r, 200)); // evita limite de rate
    }

    res.json({ status: 'OK', results: detalhados });
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
