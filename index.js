import { Router } from 'itty-router'

// Create a new router
const router = Router()

//check attributes title, username, content
function valid_attribute(post){
  post = JSON.parse(post);
  
  //need to have three attributes
  
  if(Object.keys(post).length != 3){return false}
  
  if(post.hasOwnProperty("title") != true){return false}

  if(post.hasOwnProperty("username") != true){return false}

  if(post.hasOwnProperty("content") != true){return false}

  return true
}
/*
Our index route
let value = await MY_KV.get("my-key")
*/
router.get("/", () => {
  const html = `
    Welcome! This is the root page of posts API
    You can use GET https://my-app.ellenyang.workers.dev/posts to see list of posts.
    You can use POST https://my-app.ellenyang.workers.dev/posts to create a post.
  `;
  return new Response(html,{
    header:{
      "content-type":"text/html;charset=UTF-8"
    }
  })
  
})

//GET/posts return jSON response containing a list of post objects
router.get("/posts", async() =>{
  let posts = await MY_KV.list();

  if(posts === null){
    return new Response("There are no posts",{status: 404})
  }
  
  //get list of keys
  posts = posts.keys;
  
  let post_array = [];
  
  //store value object in array
  for (let i=0; i< posts.length; i++){
    post_array.push(await MY_KV.get(posts[i]["name"]));
  }
   
  return new Response('['+post_array+']',{
    headers:{
      "Content-Type":"application/json",
      "Access-Control-Allow-Origin":"*",
      "Access-Control-Allow-Methods":"GET,HEAD,POST,OPTIONS"
    }
  });

});

/*
POST/posts
This endpoint serves as the way to create a new post. It should take JSON input of the following form:

{"title": "foo", "username": "bar", "content": "blah" ... }
*/
router.post("/posts", async request => {
   
  // If the POST data is JSON then attach it to our response.
  if (request.headers.get("Content-Type") === "application/json") {
    const reqBody = await request.json();
    //auto generate key
    let key = new Date().getTime();

    if(valid_attribute(reqBody.value)){
      //create and store k-v 
      await MY_KV.put(key,reqBody.value); 

      return new Response("success",{status: 201})
    }else{
      return new Response("The request JSON contain attribute that is not title, username, content or missing at least one of the required attributes",{status:400})
    } 
      
  }
  return new Response("The server only accepts application/json",{status: 415})

})

/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).

Visit any page that doesn't exist (e.g. /foobar) to see it in action.
*/
router.all("*", () => new Response("404, not found!", { status: 404 }))

/*
This snippet ties our worker to the router we deifned above, all incoming requests
are passed to the router where your routes are called and the response is sent.
*/
addEventListener('fetch', (e) => {
  e.respondWith(router.handle(e.request))
})
