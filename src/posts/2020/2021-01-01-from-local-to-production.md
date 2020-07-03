--- 
tags: ['draft']
title: Development Firebase Setup Series Pt 1 - Local Development With Webpack and Firebase Emulators
abstract: Draft posts should have only the draft tag
--- 

Develops Friendly Cloud Infrastructure and Automation are great allies to help developers couple with tech challenges. They can be leveraged to reduce management errors during development lifecycle and also gain agility with short cycles of implementation. Firebase suite of products and Github Actions are great examples of such tools. 

In this series we will explore the setup of a Firebase project to operate with lees boilerplate in multiple environment and activate continuos delivery from pushes to GutHub master branch. The first post is all about the local enviroment.

## Install setup cloud project with hosting, auth and firestore

Since we will be using Firebase we should create a project now. You can go to the Firebase site and create a project if you don't already have one. Then active Firebase hsoting, firestore, and simple email and password authentication.

If you have any doubts about that check this video. 

## Download Boilerplate 

Since the main focus of this series is enviroment setup we will just copy the code content. 

```
git clone ....
```

This will download our project code and basic package setup. The code is a simple login form that gives access to a UI to add items. After downloading use the terminal to tell npm to install the project dependencies.

```
npm i
```

## Init the firebase configuration

Still in the terminal we initialize and link it to the Firebase one. This link has a nice overview how to do that. For our case, run the followings commands:

```
commands
```

## Setup Webpack for continuos build

We create our webpack we start by setting it up the compile the code.

```
code
```

We can create add a npm script coutiound the code after code edits.

```
script
```

Now we need a solution to serve the code locally. Traditionally i used the webpack dev server. but since we going for the firebase emulator suite, the hosting emulator will be natural choice to secure proper running.

## Integrate Firebase Emulators

This series is still in development. The next post i intend to Integrate a test suite to make things more secure in local developement and better conditions for continous delivery with github actions. 