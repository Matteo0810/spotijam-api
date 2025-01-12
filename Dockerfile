FROM node:20.16.0-alpine

WORKDIR /app

COPY package*.json .

RUN npm install && rm -rf /tmp/*

COPY . .

# set node env to production
ENV NODE_ENV production

# build typescript project
RUN npm run build

# set the logger
ENV APP_NAME JamTogether

CMD ["npm", "run", "start"]