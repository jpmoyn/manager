const https = require('https');
const axios = require('axios');
const API_ROOT = process.env.REACT_APP_API_ROOT;
const { isEmpty } = require('lodash');

const getAxiosInstance = function(token) {
  let axiosInstance;
  return function(token) {
    if (token && axiosInstance === undefined) {
      axiosInstance = axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
        baseURL: API_ROOT,
        timeout: 10000,
        headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'WebdriverIO',
        },
      });
    } else if (!token && axiosInstance === undefined) {
       throw new Error("getting axiosInstance without having initialized it");
    }
    return axiosInstance;
  }
}()

exports.deleteAll = (token, user) => {
    return new Promise((resolve, reject) => {
        const endpoints = [
            '/domains',
            '/nodebalancers',
            '/images',
            '/account/users',
        ];

        const getEndpoint = (endpoint, user) => {
            return getAxiosInstance(token).get(`${API_ROOT}${endpoint}`)
                .then(res => {
                    if (endpoint.includes('images')) {
                        privateImages = res.data.data.filter(i => i['is_public'] === false);
                        res.data['data'] = privateImages;
                        return res.data;
                    }

                    if(endpoint.includes('users')) {
                        const nonRootUsers = res.data.data.filter(u => u.username !== user);
                        res.data['data'] = nonRootUsers;
                        return res.data;
                    }
                    return res.data;
                })
                .catch((error) => {
                    console.log('Error', error);
                    return error;
                });
        }

        const removeInstance = (res, endpoint) => {
            return getAxiosInstance(token).delete(`${endpoint}/${res.id ? res.id : res.username}`)
                .then(res => res)
                .catch((error) => {
                    console.error(error);
                });
        }

        const iterateEndpointsAndRemove = () => {
            return endpoints.map(ep => {
                return getEndpoint(ep, user)
                    .then(res => {
                        if (res.results > 0) {
                            res.data.forEach(i => {
                                removeInstance(i, ep)
                                    .then(res => res);
                            });
                        }
                    })
                    .catch(error => error);
            });
        }

        // Remove linodes, then remove all instances
        return Promise.all(iterateEndpointsAndRemove())
            .then((values) => resolve(values))
            .catch(error => {
                console.error('Error', reject(error));
            });
    });
}

exports.removeAllLinodes = token => {
    return new Promise((resolve, reject) => {
        const linodesEndpoint = '/linode/instances';
        const removeInstance = (res, endpoint) => {
            return getAxiosInstance(token).delete(`${endpoint}/${res.id}`)
                .then(res => res)
                .catch((error) => {
                    console.error('Error', error);
                    reject('Error', error);
                });
        }

        return getAxiosInstance(token).get(linodesEndpoint)
            .then(res => {
                const promiseArray =
                    res.data.data.map(l => removeInstance(l, linodesEndpoint));

                Promise.all(promiseArray).then(function(res) {
                    resolve(res);
                }).catch(error => {
                    console.error(error);
                    reject('Error', error);
                });
        });
    });
}

exports.createLinode = (token, password, linodeLabel, tags) => {
    return new Promise((resolve, reject) => {
        const linodesEndpoint = '/linode/instances';

        const linodeConfig = {
            backups_enabled: false,
            booted: true,
            image: 'linode/debian9',
            region: 'us-east',
            root_pass: password,
            type: 'g6-standard-1'
        }

        if (linodeLabel !== false) {
            linodeConfig['label'] = linodeLabel;
        }

        if (!isEmpty(tags)) {
            linodeConfig['tags'] = tags;
        }

        return getAxiosInstance(token).post(linodesEndpoint, linodeConfig)
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                console.error('Error', error);
                reject(error);
            });
    });
}

exports.allocatePrivateIp = (token, linodeId) => {
    return new Promise((resolve, reject) => {
        const ipsEndpoint = `/linode/instances/${linodeId}/ips`;
        const requestPrivate = {
            public: false,
            type: 'ipv4',
        }

        return getAxiosInstance(token).post(ipsEndpoint, requestPrivate)
            .then(response => resolve(response.data))
            .catch(error => {
                console.error('Error', error);
                reject(error);
            });
    });
}

exports.getNodebalancers = token => {
    return new Promise((resolve, reject) => {
        const endpoint = '/nodebalancers';

        return getAxiosInstance(token).get(endpoint)
            .then(response => resolve(response.data))
            .catch(error => {
                console.error('Error', error);
                reject(error);
            });
    });
}

exports.removeNodebalancer = (token, nodeBalancerId) => {
    return new Promise((resolve, reject) => {
        const endpoint = `/nodebalancers/${nodeBalancerId}`;

        return getAxiosInstance(token).delete(endpoint)
            .then(response => resolve(response.data))
            .catch(error => {
                console.error('Error', error);
                reject(error);
            });
    });
}

exports.removeAllVolumes = token => {
    return new Promise((resolve, reject) => {
        const endpoint = '/volumes';

        const removeVolume = (res, endpoint) => {
            return getAxiosInstance(token).delete(`${endpoint}/${res.id}`)
                .then(response => response.status)
                .catch(error => {
                    reject(`Removing Volume ${res.id} failed due to ${JSON.stringify(error.response.data)}`);
                });
        }

        return getAxiosInstance(token).get(endpoint).then(res => {
            const removeVolumesArray =
                res.data.data.map(v => removeVolume(v, endpoint));

            Promise.all(removeVolumesArray).then(function(res) {
                resolve(res);
            }).catch(error => {
                console.log(error.data);
                return error;
            });
        });
    });
}

exports.getDomains = token => {
    return new Promise((resolve, reject) => {
        const endpoint = '/domains';

        return getAxiosInstance(token).get(endpoint)
            .then(response => resolve(response.data))
            .catch(error => {
                console.error('Error', error);
                reject(error);
            });
    });
}

exports.removeDomain = (token, domainId) => {
    return new Promise((resolve, reject) => {
        const endpoint = `/domains/${domainId}`;

        getAxiosInstance(token).delete(endpoint)
            .then(response => resolve(response.data))
            .catch(error => {
                console.error(error);
                reject(error);
            });
    });
}

exports.getMyStackScripts = token => {
    return new Promise((resolve, reject) => {
        const endpoint = '/linode/stackscripts';
        getAxiosInstance(token).get(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Filter': `{"username":"${browser.options.testUser}","+order_by":"deployments_total","+order":"desc"}`,
                'User-Agent': 'WebdriverIO',
            }
        })
        .then(response => resolve(response.data))
        .catch(error => {
            console.error('Error', error);
            reject(error);
        });
    });
}

exports.removeStackScript = (token, id) => {
    return new Promise((resolve, reject) => {
        const endpoint = `/linode/stackscripts/${id}`;
        getAxiosInstance(token).delete(endpoint)
            .then(response => resolve(response.data))
            .catch(error => {
                console.error('Error', error);
                reject(error);
            });
    });
}


exports.getPrivateImages = token => {
    return browser.call(function() {
        return new Promise((resolve, reject) => {
            const endpoint = '/images?page=1';

            return getAxiosInstance(token).get(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Filter': '{"is_public":false}',
                    'User-Agent': 'WebdriverIO',
                }
            })
            .then(response => resolve(response.data))
            .catch(error => {
                console.error('Error', error);
                reject(error);
            });
        });
    });
}

exports.removeImage = (token, id) => {
    return browser.call(function() {
        return new Promise((resolve, reject) => {
            const endpoint = `/images/${id}`;

            return getAxiosInstance(token).delete(endpoint)
                .then(response => resolve(response.data))
                .catch(error => {
                    console.error('Error', error);
                    reject(error);
                });
        });
    });
}

exports.getPublicKeys = token => {
    return browser.call(function() {
        return new Promise((resolve, reject) => {
            const endpoint = '/profile/sshkeys';

            return getAxiosInstance(token)
                .get(endpoint)
                .then(response => resolve(response.data))
                .catch(error => {
                    console.error("Error", error);
                    reject(error);
                });
        });
    });
}

exports.removePublicKey = (token, id) => {
    return browser.call(function() {
        return new Promise((resolve, reject) => {
            const endpoint = `/profile/sshkeys/${id}`;

            return getAxiosInstance(token)
                .delete(endpoint)
                .then(response => resolve(response.data))
                .catch(error => {
                    console.error('Error', error);
                    reject(error);
                });
        });
    })
}


exports.getUsers = (token) => {
    return new Promise((resolve, reject) => {
        const endpoint = '/account/users';

        return getAxiosInstance(token)
            .get(endpoint)
            .then(response => resolve(response.data))
            .catch(error => {
                console.error('Error', error);
                reject(error);
            });
    });
}


exports.deleteUser = (token, username) => {
    return new Promise((resolve, reject) => {
        const endpoint = `/account/users/${username}`;

        return getAxiosInstance(token)
            .delete(endpoint)
            .then(response => resolve(response.data))
            .catch(error => {
                console.error('Error', error);
                reject(error);
            });
    });
}

exports.getUserProfile = (token) => {
    return new Promise((resolve, reject) => {
        const endpoint = '/profile';

        return getAxiosInstance(token)
        .get(endpoint)
        .then(response => resolve(response.data))
        .catch(error => {
            console.error('Error', error);
            reject(error);
        });
    });
}

exports.updateUserProfile = (token, profileData) => {
    return new Promise((resolve, reject) => {
        const endpoint = '/profile';

        return getAxiosInstance(token)
            .put(endpoint,profileData)
            .then(response => resolve(response.data))
            .catch(error => {
                console.error("Error", error);
                reject(error);
            });
    });
}
