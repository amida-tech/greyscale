/**
 * Created by igi on 10.05.16.
 */
'use strict';
angular.module('greyscale.core')
    .service('greyscaleUsers', function ($q, greyscaleUserApi, greyscaleUtilsSrv) {
        var _users = {};

        return {
            get: _getUser,
            getFullNameById: _getFullNameById,
            getFullNameByUser: _getFullNameByUser,
            nobody: _nobody,
            setFullName: _setFullName
        };

        function _getUser(userId) {
            var _res, userIds, i, qty,
                unknown = [],
                promises = [];

            if (userId) {
                if (userId.constructor === Array) {
                    userIds = userId;
                } else {
                    userIds = [userId];
                }

                qty = userIds.length;

                for (i = 0; i < qty; i++) {
                    if (!_users[userIds[i]]) {
                        unknown.push(userIds[i]);
                    }
                }

                if (unknown.length > 0) {
                    promises.push(greyscaleUserApi.list({
                            id: unknown.join('|')
                        })
                        .then(function (users) {
                            var _u,
                                _qty = users.length;

                            for (_u = 0; _u < _qty; _u++) {
                                _users[users[_u].id] = users[_u];
                                _setFullName(_users[users[_u].id]);
                            }
                        })
                        .catch(function () {
                            return $q.resolve(_nobody());
                        })
                    );
                }

                _res = $q.all(promises).then(function () {
                    var _u, __res;

                    __res = [];
                    for (_u = 0; _u < qty; _u++) {
                        if (!_users[userIds[_u]]) {
                            __res.push(_nobody());
                        } else {
                            __res.push(_users[userIds[_u]]);
                        }
                    }

                    if (userId.constructor !== Array) {
                        __res = __res[0];
                    }

                    return __res;
                });
            } else {
                _res = $q.resolve(_nobody());
            }
            return _res;
        }

        function _setFullName(user) {
            if (user) {
                var _user = angular.extend(_nobody(), user);
                angular.extend(user, {
                    fullName: greyscaleUtilsSrv.getUserName(_user)
                });
            }
        }

        function _getFullNameByUser(user) {
            var _res = _nobody().fullName;

            if (user) {
                if (!user.fullName) {
                    _setFullName(user);
                }
                _res = user.fullName;
            }

            return _res;
        }

        function _getFullNameById(userId) {
            return _getUser(userId)
                .then(_getFullNameByUser);
        }

        function _nobody() {
            return {
                firstName: 'John',
                lastName: 'Doe',
                email: 'mail@example.org',
                fullName: 'John Doe'
            };
        }
    });
