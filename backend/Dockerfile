# Lahka Node.js Alpine slika za minimalno porabo virov (primerno za brezplačne oblačne pakete)
FROM node:20-alpine

WORKDIR /app

# Nastavimo okolje na produkcijsko
ENV NODE_ENV=production

# Najprej skopiramo package datoteke za izkoristek Docker predpomnilnika (cache)
COPY package*.json ./

# Namestimo le produkcijske knjižnice
RUN npm ci --omit=dev

# Skopiramo celotno izvorno kodo backenda
COPY . .

# Uporaba ne-korenskega uporabnika (node) za večjo varnost
USER node

# Privzeta vrata (oblačni gostitelji ponavadi sami določijo PORT preko okoljske spremenljivke)
EXPOSE 3000

CMD ["node", "./bin/www"]