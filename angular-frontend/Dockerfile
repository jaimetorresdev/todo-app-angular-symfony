FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install -g @angular/cli \
    && npm install

COPY . .

EXPOSE 4200

CMD ["npm", "start"]
