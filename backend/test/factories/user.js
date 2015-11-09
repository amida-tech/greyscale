var User = require('app/models/user'),
    Factory = require('lib/rosie').Factory,
    Faker = require('faker');

var UserFactory = new Factory(User);
UserFactory
  .sequence('email', function(i) { return 'someuser' + i + '@gmail.com'; } )
  .sequence('password', function(i) { return 'passw' + i; })
  .attr('role', 'admin')
  .attr('name', {
    firstName: Faker.Name.firstName(),
    lastName: Faker.Name.lastName() 
  });

module.exports = UserFactory;

