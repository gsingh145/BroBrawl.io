# Server

## How to creat public link
- server runs on local host 8080
```
ngrok http 8080
```
- outputs ngrok link
- ngrok forwards request from ngrok-link -> localhost:8080

## Client fix 
- use when any client code changes are made
```
npm run build && cp -r dist/* ../server/public/
```
- recreates the client side code build so that the server can send to browser
