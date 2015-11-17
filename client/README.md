# greyscale
# Platforms, Frameworks & Development Tools
  - [AngularJS](http://angularjs.org/): JavaScript Single Page Application Framework
  - [Bootstrap](http://getbootstrap.com/): Responsive UI Framework 
  - [Sass](http://sass-lang.com/): CSS Extension Language
  - [Compass](http://compass-style.org/): Tool for Compiling SASS into CSS
  - [NodeJS](http://nodejs.org/): Platform for Running Development Tools
  - [NPM](https://www.npmjs.org/):Package Manager for Node
  - [GruntJS](http://gruntjs.com/): Node Task Runner for Development and Build Activities
  - [Bower](http://bower.io/): Package Manager for Front End Components 
  - [Yeoman](http://yeoman.io/): Scaffolding Tool for the Front End App 
  
# Installation

## Get source code

 Get [sources from github](https://github.com/amida-tech/dre-frontend/)
 
## Install [Compass](http://compass-style.org/) SCSS compiller

(This is official install [How to](http://compass-style.org/install/))

Install Ruby. Here is [instruction](https://www.ruby-lang.org/en/documentation/installation/) please choose your platform and go on.

After Ruby will be installed, run 
```
gem update --system
gem install compass
```

> If after execute `gem update --system` you saw error about ssl sertificate.
> The reason is old rubygems. So we need to remove ssl source to be able to update gem --system which includes rubygems and so on. after this we can feel free to get back to ssl source.
>`gem sources -r https://rubygems.org/` - to temporarily remove secure connection
>`gem sources -a http://rubygems.org/` - add insecure connection
>`gem update --system` - now we're able to update rubygems without SSL
>after updating rubygems do vice versa
>`gem sources -r http://rubygems.org/` - to remove insecure connection
>`gem sources -a https://rubygems.org/` - add secure connection
>Now you're able to update gems using secure connection.
And try to update system and install compass again.


## Install [Node.js](https://nodejs.org) and global npm packages

[Download](https://nodejs.org/download/) and install Node.js server and npm package manager.

Then install yo, grunt-cli, bower, generator-angular and generator-karma:
Run (In Windows OS probably you will need to start cmd as Administarator)
```
npm install -g grunt-cli bower yo generator-karma generator-angular
```

## Install required packages

Install required npm packages. Go to 'src' directory and run 
```
npm install
```

Install required bower packages. Go to 'src' directory and run 
```
bower install
```
## Build & development

Run `grunt` for building and `grunt serve` for preview.

## Testing

Running `grunt test` will run the unit tests with karma.

## Contributing

Contributors are welcome. See issues https://github.com/amida-tech/greyscale/issues

## License

Licensed under [Apache 2.0](../LICENSE)
