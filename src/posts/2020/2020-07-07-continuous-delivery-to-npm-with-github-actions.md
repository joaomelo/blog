--- 
tags: ['featured', 'devops', 'github']
title: Continuous Delivery To NPM With GitHub Actions
abstract: How to use GitHub Actions to automatically version, test, and publish NPM packages.
--- 

Open-source libraries and frameworks help us reduce complexity for building apps, bring down bugs, and spread knowledge. In the case of JavaScript packages, [NPM](https://www.npmjs.com/) is their standard destiny. 

Continuous integration and continuous delivery techniques and tools can significantly improve the development lifecycle of those packages reducing the chance of manual missteps and enforcing best practices, like mandatory testing before releases.

[Actions](https://github.com/features/actions) is GitHub take of this kind of service. It has many appeals, like a generous free tier and, if you are already saving your code there, it is very convenient to put things together. 

In the next sections, we will explore an approach to publish packages to NPM using GitHub Actions automatically. Here we go 👨‍🔧.

## Local NPM Setup

We will focus on how to set up GitHub, so I will assume you already have some build process to achieve the final code bundle. 

The first step is to attach this process to an NPM script named `prepare` inside the `package.json` file. The name is relevant because anything there will be invoked before every publish. 

If you need any help with the build setup for NPM packages, you can check this [template repository](https://github.com/joaomelo/libt) I authored. In the README, there are links to many resources, and the template itself is a dummy but fully working package.

I will also mention a `test` script during the post, but that is optional. Considering it anyway, the script section in `package.json` would look something like this:

``` json
"scripts": {
  "test": "jest",
  "prepare": "webpack --config webpack.config.js"
},
```

Now that the NPM scripts are ready, we play with GitHub.

## GitHub Preliminaries

We start authorizing GitHub to publish on our behalf. Go to your profile section at the NPM site, then create and copy an auth token. In the GitHub repository, access the secrets section inside settings and create an **NPM_SECRET** record with the auth token content.

It is time to create the workflow file that will run our continuous delivery. There is a wizard interface for that in the **actions** tab in the GitHub repository. If you choose this route, select the first template option, renamed it to `publish.yml`, and clear all content. 

We can also generate and edit the file in the local development environment. First, create a `.github` folder in the project root and, inside it, a `workflows` subfolder. Lastly, make a `publish.yml` file inside `workflows`.

Either way, we now start editing `publish.yml`.

## Writing Jobs Inside The Workflow

In the first part of the workflow, tell GitHub when to trigger the jobs we will write later in the file. One can choose and combine many [events](https://docs.github.com/en/actions/reference/events-that-trigger-workflows), like pull requests, releases, or tags. In the code below, the workflow starts at every push to the main branch.

``` yml
name: publish

on:
  push:
    branches:
      - "main"
```

Then we begin to unfold all the jobs. The first two kick off in parallel, one to change the package version and another to test the code. Let's inspect the version bumping.

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
        uses: "phips28/gh-action-bump-version@main"
        with:
          tag-prefix: ''
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Here we reused someone else action by calling `phips28/gh-action-bump-version@main`. That script will choose the version part to increase based on the last commit text. If it finds 'major' or 'minor' string in the commit, the respective section will rise. Mostly any other message will affect the patch section. Please make sure to probe all the [provided cases](https://github.com/phips28/gh-action-bump-version).

The test job will follow. If it fails, nothing will be published.

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

If you don't automatically test, ignore the previous job, and make sure to remove its reference in the `needs` instruction bellow. That instruction tells GitHub Actions to wait for everything in it to finish successfully before continuing.

``` yml
  publish:
    needs: [bump, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          ref: main
      - uses: actions/setup-node@v1
        with:
          node-version: 12
          registry-url: https://registry.npmjs.org/
      - run: npm ci
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

Notice that the publishing step executes with the `access` argument set to `public`. That is mandatory if the package is [scoped](https://docs.npmjs.com/using-npm/scope.html) and will still work fine with non scoped if they are also public. 

The full script is available below. 

``` yml
name: publish

on:
  push:
    branches:
      - "main"

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
        uses: "phips28/gh-action-bump-version@main"
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
          ref: main
      - uses: actions/setup-node@v1
        with:
          node-version: 12
          registry-url: https://registry.npmjs.org/
      - run: npm ci
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

That's it, folks. GitHub Action is a fast-evolving ecosystem and will continue to give birth to many more useful tools. I hope the content helped 😀.