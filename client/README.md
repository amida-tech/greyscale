![logo](../images/Indaba_logo.png)

# Indaba Platforms, Frameworks & Development Tools
  - [AngularJS](http://angularjs.org/): JavaScript Single Page Application Framework
  - [Bootstrap](http://getbootstrap.com/): Responsive UI Framework 
  - [Sass](http://sass-lang.com/): CSS Extension Language
  - [Compass](http://compass-style.org/): Tool for Compiling SASS into CSS
  - [NodeJS](http://nodejs.org/): Platform for Running Development Tools
  - [NPM](https://www.npmjs.org/):Package Manager for Node
  - [GruntJS](http://gruntjs.com/): Node Task Runner for Development and Build Activities
  - [Bower](http://bower.io/): Package Manager for Front End Components 
  - [Yeoman](http://yeoman.io/): Scaffolding Tool for the Front End App 
  
# Indaba Installation

1. Download [source code](https://github.com/amida-tech/greyscale/)
2. Install the [Compass](http://compass-style.org/) SCSS compiler (Official installation guide [here](http://compass-style.org/install/))
3. Install Ruby (Installation instructions [here](https://www.ruby-lang.org/en/documentation/installation/))
4. Install Node.js, npm, yo, grunt-cli, bower, generator-angular and generator-karma

```
gem update --system
gem install compass

npm install -g grunt-cli bower yo generator-karma generator-angular

# Go to the src directory and run 
npm install
bower install

```

>If you see an error regarding the SSL certificate after executing `gem update --system`.
> This is caused by an old version of rubygems. You will need to remove the SSL source to be able to update gem --system, which includes rubygems. After this you should be able to get back to the SSL source.


```
# to temporarily remove secure connection
gem sources -r https://rubygems.org/

# to add insecure connection
gem sources -a http://rubygems.org/

# now we can update rubygems without SSL
gem update --system

# after updating rubygems, reverse the process.

# to remove the insecure connection
gem sources -r http://rubygems.org/

# add secure connection
gem sources -a https://rubygems.org/

# Now you can update gems using a secure connection.
# Next, update the system and install compass again.
```


# Configuration managment

You have the option to choose your API services from different servers. This is helpful if you do not have nor want the Backend Project set-up on your local environment.
There are different configurations:

### Development with localhost-based server

This is the development server configuration. The server must be installed on the same host where client app runs. The log to the browser console has debug information enabled.

```
grunt ngconstant:local
```

### Development without server (dev)

This is the development server configuration. The log to the browser console has debug information enabled.

```
grunt ngconstant:dev
```


###*Note about config switch*
Switching config will update *greyscale.core.greyscaleEnv* constant (greyscale\app\greyscale.core\scripts\config\greyscale-env.js)
Please do not update it manually.


# Build & development

To build, run `grunt`

To preview, run `grunt serve`

### Build for docker deployment

To build a deployment suitable for a docker image, run `grunt buildDocker`


# Testing

Running `grunt test` will run the unit tests with karma
