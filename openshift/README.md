# Indaba on OpenShift

## Local Setup
In order to develop with OpenShift, it is strongly recommended that you install [Minishift](https://github.com/minishift/minishift/).
Follow the instructions [here](https://docs.openshift.org/latest/minishift/getting-started/index.html) in order to get a Minishift
cluster running on your local machine.

## Initial Deployment
You are more than welcome to set up the individual Indaba services from scratch. However, this repository provides a template for
a functioning Indaba application. It contains the following components:
- An empty Postgres database
- An Indaba backend instance, networked to Postgres and memcached.
- An Indaba frontend instance, networked to the backend, and with a load balancer mapping from port 80 to port 8080, running HTTP.

To initialize the template, simply run:
```sh
oc create -f greyscale.yml
```
It is also possible to import the file from the OpenShift console. This allows you to view and modify all project parameters before deploying the application.

### Note on Postgres
In the current iteration of the Indaba backend, seed `.sql` files are required to properly configure the database. You can create a tunnel connection
to your postgres pod to complete these steps. However, the `data.tar.gz` file contains an initial DB directory structure, which can be copied with
`rsync` to `/var/lib/pgsql/data/` in the postgres persistent volume.

## TODO
- Add health checks
- Add dev/staging/prod environment setup
- Add build pipelines
- Add release tagging
- Add rolling deployment configuration
- Add autoscaling behavior
- HTTPS
- Github hooks
