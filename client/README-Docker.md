![logo](../images/Indaba_logo.png)


# Indaba Client Docker Image

The greyscale client docker image utilizes the current content of dist and deploys to a nginx server for hosting of static files.

## Build a Docker Image

````
# build the dist folder
grunt build

# build the image
docker build -t greyscale-client 

````
  
## Run the Docker Image

The image uses the environment variable "INDABA_URL" which points to the backend system from the perspective of the image itself. 

```
# to create a Indaba client instance
docker run -e INDABA_URL='http://192.168.0.116:3001' --name greyscale_client_1 -p 80:80 greyscale-client

# to start an existing Indaba client instance
docker start greyscale_client_1

# to stop an existing Indaba client instance
docker stop greyscale_client_1
  ```
  