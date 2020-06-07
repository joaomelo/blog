--- 
tags: ['firebase', 'firestore', 'authentication']
title: How To Combine Firebase Authentication And Firestore To Save User Data
abstract: ...
--- 

[Firebase](https://firebase.google.com/) is a boost of agility to solo developers and small teams. One of its main conveniences is the authentication service. But after a few times building login UI with Firebase Authentication (Fireauth), I found myself repeating code to wrap or complement its features. One of such cases is the need to combine user data from Fireauth with another dataset.

Fireauth can hold some profile user data but they are limited to a [fixed set of basic properties](https://firebase.google.com/docs/auth/users#user_properties) if you want more you need another database solution. Firestore is a natural option since its part of the same suite and is by itself a great database solution.

But now we introduced the friction to handle two dataset in our app. Is important to develop a sensible approach ro read and write user data so we the rest of app can be blind to this complexity and only see a user with lots of information available to read and a simple write API. Let's do it.

## Just Fireauth

We could imagine ourselves working on a `auth.js` module inside a bigger web app. Inside our module we need to export a interface, so the rest of the app can access the user information we fuse between Fireauth and Firestore. 

We could start by exporting a simple object with status and user data. Like this.

``` js
// auth.js
const authState = {
  userData: null
};

export { authState };
```

We could then import the Firebase Auth object initialized somewhere else and update the authState still with only Fireauth user data. We do that by passing a observer function to the `onAuthStateChanged` method of the imported `fireauth` object. Like so.

``` js
import { fireauth } from './init-firebase.js'

const authState = {
  userData: null
};

fireauth.onAuthStateChanged(user => {
  authState.userData = user
    ? {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    : null; // user has signed out
});

export { authState };
```

Rigth now anyone that import `authState` will receive the must updated data at the moment of the import is interpreted. Which is kinda not so coll.

## Notifying State Change

The problem here is that many auth dependent situation would some sort of event signal to now that the auth state changed. Like a routing system that will react to a user signing in to show the home page a fill a welcome message with the user email.

We can leverage events libraries to help us on that. [Rxjs](https://rxjs-dev.firebaseapp.com/) is the golden standard and you should check on that for sure. To make things simple i will use a [small library](https://github.com/joaomelo/bus) i wrote that exports general `subscribe` and `publish` functions. 

Subscribe allow the rest o the app pass observer functions associated to a event name. Every time other place on the someone call publish with that event name, all observers functions will be called with the parameters passed to publish.

The code bellow give the option to import the state store directly or subscribe to upates and always receive the last user data.
 
``` js
// auth.js
import { publish } from '@joaomelo/bus'
import { fireauth } from './init-firebase.js'

const authState = {
  userData: null
};

fireauth.onAuthStateChanged(user => {
  authState.userData = user
    ? {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    : null; // user has signed out
      
  // the spread operator avoid direct reference
  // the state object
  publish('AUTH_STATE_CHANGED', { ...authState });
});

export { authState };

// some-place-else.js
import { subscribe } from '@joaomelo/bus'
subscribe('AUTH_STATE_CHANGED', authState => concole.log(authState));
```

But Firestore integration is still lacking.

## Reading Firestore Data

We will save a document for every user in a Firestore `profiles` collection. Firestore also offers a subscriber function to observe data changes direct in a document. We can use the user id as the same id in the document and advance our auth module.

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
    publish('AUTH_STATE_CHANGED', { ...authState });
    return;
  }

  const fireauthData = {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL
  }

  // maybe this doc does not exists yet
  const docRef = firestore
    .collection('profiles')
    .doc(user.uid);

  docRef
    // 'set' secures doc creation without affecting any data
    .set({}, { merge: true }) 
    .then(() => { 
      this.config.fuse.docRef.onSnapshot(doc => {
        authState.userData = {
          ...fireauthData,
          ...doc.data()
        }
        publish('AUTH_STATE_CHANGED', { ...authState });
      });
    });  
});

export { authState };
```

But what of we need to update that?

## Updating User Data

We could export a updateUserData function that receives the user id and a series of properties and go with the proper updates using Firestore.

``` js
// auth.js
// ...

function updateUserData(props){
  const docRef = firestore
    .collection('profiles')
    .doc(authState.userData.id);

  // set will return a promise that resolves after
  //the update is complete
  return docRef.set(props, { merge: true });
}

export { authState, updateUserData };
```

That simple :). Now we have a central place for the whole app to listen to auth state change and also update user profile information.

## Wrapping Up

You must be aware that we did not do any sort of data checking and is very dangerous in a production app. Also know that Firestore data need [security rules](https://firebase.google.com/docs/firestore/security/get-started) to funnel who and how data could be read and updated.

If you are interested, I created an library that deal with that data merging between Fireauth and Firestore data and other goodies. It is open-sourced in this GitHub [repository](https://github.com/joaomelo/auth-mech/blob/master/lib/src/auth-mech.js).

Goodbye and stay health.