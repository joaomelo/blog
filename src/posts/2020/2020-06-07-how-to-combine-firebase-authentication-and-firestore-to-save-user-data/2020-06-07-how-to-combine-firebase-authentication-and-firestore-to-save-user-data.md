--- 
tags: ['featured', 'firebase', 'auth']
title: How To Combine Firebase Authentication And Firestore To Save User Data
abstract: A guide about using Firestore documents to extend the management of user profile data beyond the fixed set of properties offered by Firebase Authentication.
--- 

[Firebase](https://firebase.google.com/) is a boost of agility to solo developers and small teams. One of its main conveniences is the authentication service. But after a few times building login UI with Firebase Authentication (Fireauth), I found myself repeating code to wrap or complement its features. One of such cases is the need to combine user data from Fireauth with another database.

Fireauth can hold some profile user data, but they are limited to a ["fixed set of basic properties"](https://firebase.google.com/docs/auth/users#user`properties). If you want more, you need a database solution. Firestore is part of the same suite and is, by its own merits, an excellent product.

But now we introduced the friction to handle two datasets in our app. It is essential to encapsulate the approach to read and write user data in that scenario, so the rest of the app can be blind to this complexity and only see a user with lots of information available to read and simple to extend. Let's do it.

## Storing Fireauth Fresh User Information

Picture ourselves working on an `auth.js` module inside a bigger web app. In that module, we need to export an interface to the rest of the app, so it can access the user information we fuse between Fireauth and Firestore. 

We could start by exporting a simple object that will work as a data store.

``` js
// auth.js
const authState = {
  userData: null
};

export { authState };
```

Then, we import the Fireauth object initialized somewhere else in the app and update `authState` still with only Fireauth data. That is done by passing an observer function to the `onAuthStateChanged` method of the imported `fireauth` object. Check the code below.

``` js
import { fireauth } from './init-firebase.js'

const authState = {
  userData: null
};

fireauth.onAuthStateChanged(user => {
  authState.userData = user
    ? { id: user.uid, email: user.email }
    : null; // user has signed out
});

export { authState };
```

Anyone who imports `authState` will receive the most updated data at the moment the import statement is interpreted. Which is very uncool 😳.

## Notifying State Change

Most auth dependent features need to be signaled when auth state changes. A routing system will react to a user signing in by showing the home page with a logout button labeled using the user email.

We can leverage event libraries to help us with that. [Rxjs](https://rxjs-dev.firebaseapp.com/) is the gold standard, make sure you check on that. To make things simpler, let's use a [small library](https://github.com/joaomelo/bus) I wrote. It exports two generics `subscribe` and `publish` functions. 

The `subscribe` function allows registering observer functions associated with an event name. Every time the `publish` function is called with that event name, all associated observer functions will be called with the passed payload as an argument.

The code below improves our auth module, raising the ability to subscribe to auth state changes and always receive the latest user data.
 
``` js
// auth.js
import { publish } from '@joaomelo/bus'
import { fireauth } from './init-firebase.js'

const authState = {
  userData: null
};

fireauth.onAuthStateChanged(user => {
  authState.userData = user
    ? { id: user.uid, email: user.email }
    : null;
      
  // the spread operator avoids direct reference
  // to the state object
  publish('AUTH`STATE`CHANGED', { ...authState });
});

export { authState };

// some-place-else.js
import { subscribe } from '@joaomelo/bus'
subscribe('AUTH`STATE`CHANGED', 
  authState => console.log(authState));
```

That's better 👌, now we can work on the lacking Firestore integration.

## Reading Firestore Data

In Firestore, we will have a `profiles` collection with a document for every user. The user id will be the tie between a user in Fireauth and the collection's record. For our great happiness 🙏, Firestore offers a function to observe data changes directly from this profile document. The following code implements that approach.

``` js
// auth.js
import { publish } from '@joaomelo/bus'
import { fireauth, firestore } from './init-firebase.js'

const authState = {
  userData: null
};

fireauth.onAuthStateChanged(user => {
  if (!user) {
    authState.userData = null;
    publish('AUTH`STATE`CHANGED', { ...authState });
    return;
  }

  // we must be carefull
  // maybe this doc does not exists yet
  const docRef = firestore
    .collection('profiles')
    .doc(user.uid);

  docRef
    // 'set' secures doc creation without 
    // affecting any preexisting data
    .set({}, { merge: true }) 
    .then(() => { 
      docRef.onSnapshot(doc => {
        // the first data load
        // and subsequent updates
        // will trigger this
        authState.userData = {
          id: user.uid, 
          email: user.email,
          ...doc.data()
        };
        publish('AUTH`STATE`CHANGED', { ...authState });
      });
    });  
});

export { authState };
```

That's fancy 💃 stuff. But what if we need to update that user profile?

## Updating User Data

To update user data stored in Firestore, we could create and export a `updateUserData` function that receives the properties values inside a `props` parameter. See.

``` js
// auth.js

// ... all the code until now

function updateUserData(props) {
  const docRef = firestore
    .collection('profiles')
    .doc(authState.userData.id);

  // set will return a promise that resolves after
  // the update is complete
  return docRef.set(props, { merge: true });
}

export { authState, updateUserData };
```

So simple, I love it 🥰. 

Now we have a module the whole app can use to listen to auth state changes and also freely update user profile information.

## Wrapping Up

Some things were left out. You must have already realized that we did not check any data. That would be very dangerous in a production app. Also, know that Firestore needs properly [Security Rules](https://firebase.google.com/docs/firestore/security/get-started) to funnel down who and how data could be read and updated.

We could also create a status property in `authState` to better signal what event happened. 

If you are interested, I created a library that deals with that merging between Fireauth and Firestore data and other goodies. It is open-sourced in this GitHub [repository](https://github.com/joaomelo/auth-mech/blob/master/lib/src/auth-mech.js) and available as a npm [package](https://www.npmjs.com/package/@joaomelo/auth-mech).

Goodbye, and stay healthy 😷.