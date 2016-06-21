/**
 * Created by igi on 10.05.16.
 */
'use strict';
angular.module('greyscale.core')
    .service('greyscaleUsers', function ($q, greyscaleUserApi) {
        var _users = {};

        this.get = function (userId) {
            var _res;
            if (userId >= 0) {
                if (_users[userId]) {
                    _res = $q.resolve(_users[userId]);
                } else {
                    _users[userId] = greyscaleUserApi.list({
                            id: userId
                        })
                        .then(function (users) {
                            var u, _user,
                                qty = users.length;
                            for (u = 0; u < qty; u++) {
                                _user = users[u];
                                _users[_user.id] = _user;
                            }
                            if (_users[userId]) {
                                return _users[userId];
                            } else {
                                return _nobody();
                            }
                        })
                        .catch(function () {
                            _users[userId] = null;
                            return $q.resolve(_nobody());
                        });
                    _res = _users[userId];
                }
            } else {
                _res = $q.resolve(_nobody());
            }
            return _res;
        };

        function _nobody() {
            return {
                firstName: 'John',
                lastName: 'Doe',
                email: 'mail@example.org'
            };
        }
    });
