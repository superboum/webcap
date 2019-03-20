FROM amd64/debian:buster

RUN apt-get update && \
    apt-get install -y nodejs npm && \
    chown 1000:1000 /srv

WORKDIR /srv
USER 1000
COPY package.json package-lock.json index.js .

RUN npm install

CMD ["/usr/bin/nodejs", "index.js"]
