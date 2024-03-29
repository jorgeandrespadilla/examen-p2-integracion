import { PrismaClient } from '@prisma/client'
import express from 'express'
import dotenv from 'dotenv'
import { getCityGeolocationInfo } from './services/geolocation';

dotenv.config();

const prisma = new PrismaClient()
const app = express()

app.use(express.json())

app.get('/usuarios', async (req, res) => {
  const users = await prisma.usuario.findMany();
  res.json(users);
})

app.get('/usuarios/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: 'El ID de usuario es requerido' });
    return;
  }

  const user = await prisma.usuario.findUnique({
    where: {
      id: id
    }
  });
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  res.json(user);
})

app.get('/georeferencias', async (req, res) => {
  const georeferencias = await prisma.georeferenciaCiudad.findMany();
  res.json(georeferencias);
})

app.get('/georeferenciaPorCiudad/:ciudad', async (req, res) => {
  const ciudad = req.params.ciudad;
  if (!ciudad) {
    res.status(400).json({ error: 'La ciudad es requerida' });
    return;
  }

  const georeferencia = await prisma.georeferenciaCiudad.findUnique({
    where: {
      ciudad: ciudad
    }
  });
  if (!georeferencia) {
    res.status(404).json({ error: `Información de georeferencia no encontrada para la ciudad ${ciudad}` });
    return;
  }
  res.json(georeferencia);
})

app.post('/cargarGeoreferencia', async (req, res) => {
  const usuario: string = req.body.usuario;
  if (!usuario) {
    res.status(400).json({ error: 'El usuario es requerido' });
    return;
  }

  const user = await prisma.usuario.findUnique({
    where: {
      usuario: usuario
    }
  });
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const city = user.ciudad;
  const ciudad = await prisma.georeferenciaCiudad.findUnique({
    where: {
      ciudad: city
    }
  });
  if (ciudad) {
    res.status(200).json({ message: `La georeferencia para la ciudad ${city} ya existe` });
    return;
  }

  const geolocationInfo = await getCityGeolocationInfo(city);
  if (!geolocationInfo) {
    res.status(404).json({ error: `Información de georeferencia no encontrada para la ciudad ${city}` });
    return;
  }
  await prisma.georeferenciaCiudad.create({
    data: geolocationInfo
  });
  res.status(200).json({ message: `Georeferencia creada para la ciudad ${city}` });
})

const server = app.listen(3000, () =>
  console.log("Servidor ejecutándose en: http://localhost:3000")
);