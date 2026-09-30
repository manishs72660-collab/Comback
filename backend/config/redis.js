const{ createClient } =require("redis");

const client = createClient({
    username: "default",
    password: process.env.REDISH_KEY,
    socket: {
        host: process.env.REDISH_HOST,
        port: 13233
    },
});
module.exports=client;
