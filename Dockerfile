FROM nginx:1.20
COPY ./dist /usr/share/nginx/html
RUN cd /etc/nginx/conf.d && rm -rf *
COPY ./nginx.conf /etc/nginx/conf.d