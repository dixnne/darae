# Usamos Node.js para el desarrollo de React
FROM node:20-slim

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el código fuente
COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# Ejecutamos el servidor de desarrollo de Vite
# Usamos --host para que Docker pueda mapear el puerto correctamente
CMD ["npm", "run", "dev", "--", "--host"]