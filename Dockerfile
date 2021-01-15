FROM node:14
# Setting working directory. All the path will be relative to WORKDIR
WORKDIR /usr/src/app
# Install PM2 globally
RUN npm install --global pm2
# Installing dependencies
COPY package*.json ./
RUN npm install
# Copying source files
COPY . .

ENV NODE_ENV=production
ENV TZ=America/Los_Angeles
# Run npm start script with PM2 when container starts
CMD [ "pm2-runtime", "npm", "--", "start" ]