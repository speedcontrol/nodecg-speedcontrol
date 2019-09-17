FROM node:10
WORKDIR /home/node/app
RUN npm i -g nodecg-cli
RUN nodecg setup
WORKDIR /home/node/app/bundles/nodecg-speedcontrol
COPY ./package*.json /home/node/app/bundles/nodecg-speedcontrol/
RUN npm i
#RUN npm i --production
COPY . /home/node/app/bundles/nodecg-speedcontrol/
RUN npx cross-env NODE_ENV=production node script/bundle.js && npx tsc -b tsconfig.extension.json
WORKDIR /home/node/app
EXPOSE 9090
CMD nodecg start