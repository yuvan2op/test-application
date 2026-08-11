FROM nginx:alpine

ENV BACKEND_HOST=testapp-backend

COPY index.html /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
