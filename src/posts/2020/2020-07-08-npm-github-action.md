--- 
tags: ['draft']
title: Bump and Publish Npm GitHub Actions
abstract: libraries, frameworks... How to Move Publish Npm Packages from Local to GisHub Action
--- 

Open source libraries and frameworks are cool 😎. They reduce the complexity for building apps, reduce bugs and spread knowledge. In the case of JavaScript, NPM is the standard destiny. In NPM, libraries, frameworks or other pieces of shared code are all named as packages.

In the development lifecycle of those packages, we can improved the deploy to NPM with continuos delivery tools. They can deepen the quality of our code by reducing the chance of manual errors and enforcing best practices like mandatory testing before releases.

[GitHub Actions](https://github.com/features/actions) is GitHub take of this kind of service. It has a nice free tier and, if you are already saving your code there, becomes really convenient to put things together. 

In the next sections we are going to explore an approach to automatically publish packages to NPM with GitHub Actions. 

## Local NPM Setup

We be focusing on how to setup GitHub, so I will assume you already have your code and some build process to arrive at the final bundle to be distributed. That build process has to be attached to an NPM script like `build`. I will also mention a test script later.

If you need any help on build setup for NPM packages, you can check this [template repository](https://github.com/joaomelo/libt) I made and inspired this post. In the README there are links to many resources and the repository itself is a dummy working library. You can check the build process by inspecting webpack files.

Lastly, in the `package.json`, we link the build process with a `prepare` script. This will secure that build will[automatically](https://docs.npmjs.com/misc/scripts) happens before every publish.

The scripts section will look like this:

``` json
"scripts": {
  "lint": "eslint */src/**/*.js",
  "test": "npm run lint && jest",
  "build": "webpack --config lib/config/webpack.config.js",
  "prepare": "npm run build"
},
```

## GitHub Preparation

First, we must give GitHub the authorization to publish in our behalf. Go to your profile section at NPM, then create and copy an auth token. Now go to the secrets section in the package GitHub repository and create a **NPM_SECRET** record with the auth token content.

Now we create a Workflow. There is a wizard interface for that in the `actions` tab in the GitHub repository. You can also manually create one inside the code editor. First create a `.github` folder in the project root, inside there create a `workflows` subfolder, and inside there create a `publish.yml` file. 

## Writing Jobs Inside The Workflow

In the first part of the workflow, we tell GitHub when to trigger the jobs. One can chose many [events](https://docs.github.com/en/actions/reference/events-that-trigger-workflows) like pull requests, releases or tags. In the code bellow, we start the workflow at every push to the master branch.

``` yml
name: publish

on:
  push:
    branches:
      - "master"
```

Then we start to unfold all the jobs. Two are set in parallel, one to change the package version and another to test the code. Let's check the version bumping.

``` yml
jobs:
  bump:
    runs-on: ubuntu-latest
    steps:
      - uses: "actions/checkout@v2"
        with:
          ref: ${{ github.ref }}
      - uses: "actions/setup-node@v1"
        with:
          node-version: 12
      - name: "version bump"
        uses: "phips28/gh-action-bump-version@master"
        with:
          tag-prefix: ''
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The script will choose the version section to increase based on the last commit message. In short, if 'major' or 'minor' strings are found in the commit text the respective section will be bumped and mostly others case will affect the patch section. You can check all the cases in the [docs](https://github.com/phips28/gh-action-bump-version).

The test job will follow. If it fails, nothing will be published. Check it out.

``` yml
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
        with:
          node-version: 12
      - run: npm ci
      - run: npm test
```

Lastly we create a job to publish to NPM. You will notice the needs instruction at the script beginning. This tell GitHub Actions to wait both jobs to finish successfully before starting this job.

``` yml
  publish:
    needs: [bump, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          ref: master
      - uses: actions/setup-node@v1
        with:
          node-version: 12
          registry-url: https://registry.npmjs.org/
      - run: npm ci
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

The publish step was set with the public access argument. That is mandatory if the package is [scoped](https://docs.npmjs.com/using-npm/scope.html) but will work just fine with non scoped public packages. The full script in available below. 

``` yml
name: publish

on:
  push:
    branches:
      - "master"

jobs:
  bump:
    runs-on: ubuntu-latest
    steps:
      - uses: "actions/checkout@v2"
        with:
          ref: ${{ github.ref }}
      - run: sed -n 3p ./package.json
      - uses: "actions/setup-node@v1"
        with:
          node-version: 12
      - name: "version bump"
        uses: "phips28/gh-action-bump-version@master"
        with:
          tag-prefix: ''
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - run: sed -n 3p ./package.json

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
        with:
          node-version: 12
      - run: npm ci
      - run: npm test

  publish:
    needs: [bump, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          ref: master
      - uses: actions/setup-node@v1
        with:
          node-version: 12
          registry-url: https://registry.npmjs.org/
      - run: npm ci
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

Thats it folks. GitHub Action is a fast evolving ecosystem and will probably give birth to many more useful tools. Hope the content helped 😀.