--- 
tags: ['featured', 'devops', 'firebase']
title: Using Firebase Automatic URLs To Improve Development Workflow
abstract: Firebase offers a way to automatic setup and initialize projects inside the app. These hosting URLs can be an ally to reduce codebase and facilitate development workflows like continuous delivery. The post explores how and why to use them in JavaScript web apps.
--- 

If you've been using [Firebase](https://firebase.google.com) in your JavaScript projects for some time, there is a good chance you link your app to Firebase using a configuration object. First installing the Firebase [npm package](https://www.npmjs.com/package/firebase), then importing and using it in the source code similarly to the instructions below.

``` js
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MSG_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const fireapp = firebase.initializeApp(config);
const fireauth = fireapp.auth();
const firedb = fireapp.firestore();

export { fireapp, fireauth, firedb };
```

There is nothing wrong with that, but it is good to know there are other options that can potentially reduce boilerplate and risk of errors in our apps.

## The Three Options To Add Firebase

At the time of this writing, there are three options to link Firebase to a JavaScript web project. You can always check them in [Firebase docs](https://firebase.google.com/docs/web/setup#add-sdks-initialize). In short, the first one was mentioned in the post introduction. 

The second option uses a CDN to import Firebase SDKs. Instead of installing an npm package, we insert the corresponding CDN links in the HTML code. Then, manually set up the config object like in the first option. 

Thirdly, we insert some unique URLs in the HTML. But unlike the CDN approach, Firebase hosting servers react to those URLs and take care not just with importing SDKs, but also automatically activating the proper project configuration.

I want to analyze these Auto Hosting URLs in more detail. Let's start by making sure how to put them in motion and then explore how they affect development workflow.

## Auto Hosting URLs Reduce Code Footprint

If you host your app with Firebase, its servers will already know during runtime what project that code belongs to. The job of grabbing all the configuration data and securely inject it into the app becomes straightforward for them. What it needs from you is what SDKs versions you want to use. We signal that with those magical URLs. Check it out.

``` html
<body>
  <!-- start: firebase -->
  <script src="/__/firebase/7.15.5/firebase-app.js"></script>
  <!-- feature specific modules  -->
  <script src="/__/firebase/7.15.5/firebase-auth.js"></script>
  <script src="/__/firebase/7.15.5/firebase-firestore.js"></script>
  <!-- full list of SDKs here https://bit.ly/3dLSmTO -->
  <!-- config initialization -->
  <script src="/__/firebase/init.js"></script>  
  <!-- end: firebase -->

  <p>Hello World!</p>
</body>
```

After the scripts are loaded, Firebase will be available as a global variable in our app. We can implement some encapsulation and create a central module from which others can import. It will be a small js file like this.

``` js
const fireapp = firebase.app();
const fireauth = fireapp.auth();
const firedb = fireapp.firestore();

export { fireapp, fireauth, firedb };
```

Even with this step (which I recommend), we have a smaller code footprint. But the benefits don't end here.

## Easier Project Switch 

An everyday use case is to keep multiple Firebase projects for the same app. One for development, other for production, maybe even inserting a staging project, could be a good idea depending on how critical the app is. The point is to preserve production data and avoid errors during releases.

With the approach based on config objects, we have to find a way to manage the decision of which configuration data to use. A popular design is to create a `.env` file for each environment with corresponding Webpack (or another build tool) instructions to inject configuration as environment variables during build time.

As said before, that is absolutely fine, but since Firebase already knows your projects, we could leverage the service capability to take care of that data management. 

For starts, since `.env` files are not suitable for git storage; they will have to be recreated after every project cloning, for example. I know it is not that much trouble, but with every keystroke comes an error opportunity. What if we copy the production data inside `.dev.env`?.

Another benefit is that continuous delivery becomes easier. Instead of having to figure a way to load configuration data on those services, we could limit ourselves to deal with just the project id. The example below is adapted from one of my GitHub repositories and illustrates the approach by using GitHub actions for continuous delivery to Firebase.

``` yml
# ...some preceding configuration
publish:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
      with:
        ref: master
    - uses: actions/setup-node@v1
      with:
        node-version: 12
    - run: npm ci
    - run: npm run build
    - uses: w9jds/firebase-action@master
      with:
        args: deploy
      env:
        PROJECT_ID: some-project-id
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

I recently decided to start using Firebase emulators for local development and also seized the opportunity to also implement the Hosting URLs. It gave me that warm feeling of lifting some (even if small) mental load. Well, I, too, enjoy playing with this kind of puzzles anyway 😊.

Thanks for the opportunity to share. I hope it helps.