FROM node:0.12.9-onbuild

# Rubygems
RUN apt-get update && \
    apt-get install -y rubygems ruby-dev

# Compass
RUN gem update --system && \
    gem install compass

# Install global npm packages
RUN npm install -g \
    grunt-cli \
    bower \
    yo \
    generator-karma \
    generator-angular

# Bower
# First line allows bower to run as root
RUN echo '{ "allow_root": true }' > /root/.bowerrc && \
    bower install

# Fix imagemin issue
RUN npm install grunt-contrib-imagemin

# Configuration management
RUN grunt ngconstant:dev

# Build
RUN grunt build --force

# Expose
EXPOSE 8081

CMD ["grunt", "serve:docker"]
