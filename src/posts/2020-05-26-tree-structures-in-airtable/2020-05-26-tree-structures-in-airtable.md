--- 
tags: ['airtable', 'api', 'algorithm']
title: Tree Structures in Airtable
abstract: How to create tree data structures in Airtable using a companion simple App and airtablejs official API.
--- 
[Airtable](https://airtable.com/) is a powerful tool. It has tons of features to edit and visualize data. I use it to organize many of my personal workflows, but is also a amazing prototyping mechanism to test ideas before starting a new app.

One of my small frustrations with it, is the inability to create a tree structure suitable to my needs. As you can see bellow, Airtable is perfectly able to link records in the same table. But i cannot find a way to proper order items without a way to fill a path string in them.

![unable to create tree in airtable](./tree-unable-in-airtable.gif)

The good news is that Airtable offers an API. So with the power of JavaScript and few packages we can create our path. Let me share a way to accomplish that.

## Project Setup

We will be using vanilla Html and JavaScript for our project with help of some packages: 
- [Axios](https://github.com/axios/axios) creates a nice abstraction to consume APIs; 
- [Rxjs](https://rxjs-dev.firebaseapp.com/) will help us debounce API calls to respect Airtable's imposing limits; 
- [Tailwind](https://tailwindcss.com/) has many utility classes to style our app.

I wrote the all the code in this post using [Visual Studio Code](https://code.visualstudio.com/) and run everything with the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension. Enough of talking, let's code.

We start by creating _index.html_ with the code bellow just to pull the packages and our own script file that we will create in the sequence.

If you are not familiar with Tailwind, it is a css framework with an [utility first](https://tailwindcss.com/docs/utility-first/) mentality. You don't need to learn anything about it for our exercise here. Keep calm and carry on aware that we will be using a lot of classes in our html. 

``` html
<!DOCTYPE html>
<html>

  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <link href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://unpkg.com/airtable@0.8.1/build/airtable.browser.js"></script>
    <script src="https://unpkg.com/@reactivex/rxjs@6.5.5/dist/global/rxjs.umd.js"></script>
    <title>tree-structures-in-airtable</title>
  </head>

  <body class="bg-gray-100">
    <div class="max-w-screen-sm my-8 mx-auto px-4 bg-white min-h-screen">
      <h1 class="text-2xl text-gray-600 font-bold text-center pt-4">
        Tree Structures in Airtable
      </h1>
      <main id="app"></main>
    </div>
    <script src="index.js"></script>
  </body>
</html>
```

Now we create a _index.js_ file in the same folder. For now, we write a dummy code just to test if things are proper tighten.

``` js
const el = document.getElementById("app");
el.innerHTML = "Hello World!"
```

Now you can open _index.html_ in the local server of your choice and see our baby 👶 first step.

If you find yourself lost at any point have no worry, you can go to (this)[https://github.com/joaomelo/tree-structures-in-airtable] repository and download the code. I separated it in folders corresponding to each milestone of our app.

## Basic UI

Airtable API needs three basic information: your personal API key, the base id where the given table is located and the table name. So we need to create some inputs to ask that from the user, a button to run our script and a message area to provide feedback. We can update the code inside the _main_ tag of our _index.html_ with the code bellow.

``` html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <link href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://unpkg.com/airtable@0.8.1/build/airtable.browser.js"></script>
    <script src="https://unpkg.com/@reactivex/rxjs@6.5.5/dist/global/rxjs.umd.js"></script>
    <title>tree-structures-in-airtable</title>
  </head>
  <body class="bg-gray-100">
    <div class="max-w-screen-sm my-8 mx-auto px-4 bg-white min-h-screen">
      <h1 class="text-2xl text-gray-600 font-bold text-center pt-4">
        Tree Structures in Airtable
      </h1>
      <main id="app" class="text-center"></main>
    </div>
    <script src="index.js"></script>
  </body>
</html>
```

You can open the app now and cry in frustration since nothing changed 😭. That's because our _index.js_ is overwriting everything inside _main_. With a small adjustment in the tag id we change that.

``` js
const div = document.getElementById("logs");
div.innerHTML = "Hello World!"
```

Cool. Now the message is in the logs area and we move on to read data from Airtable.

## Reading Records from Airtable

Before going to the nitty gritty of loading records from Airtable we must turn on the trigger that start the whole operation. We do that by assigning a function to our Run button _onclick_ property. The function will grab the user input values ans ask Airtable for the corresponding table records. The code bellow declare some helpers functions and make the run button alive. There is also a silly version of what will be our loader function, so we can test the UI.

``` js
// helper functions
const byId = id => document.getElementById(id);

function addLog(text) {
  const p = document.createElement('p');
  p.innerText = text;
  byId('logs').appendChild(p);
}

// where everything happens
byId('run').onclick = () => {
  byId('logs').innerHTML = '';
  run();
}

function run() {
  addLog('run forest run')
}
```

By using Airtable library we start accessing the api creating a _Table_ object. This object will have the methods we need to read and update data. We can create our table object inside the _run_ function, so we pass a reference to it around. The can write a _loadRecords_ function to do just what the implies.

Inside _loadRecords_  we use the _select_ if the _Table_ object method to create a _query_ object. The query has a _eachPage_ method that transverse all records in a table by paginating trough them. It returns a promise that we use to consolidate a array with all the table records. Don't worry if you find this confusing, the code that follows will probably make more sense.

``` js
function run() {
  const apiKey = byId('key').value;
  const baseId = byId('base').value;
  const tableName = byId('table').value;

  const Airtable = require('airtable');
  const table = new Airtable({ apiKey })
    .base(baseId)
    .table(tableName)

  loadRecords(table)
    .then(records => {
      addLog(`loaded ${records.length} record(s) from ${tableName}`)
    })  
}

function loadRecords(table) {
  const allRecords = [];
  return table
    .select() // creates the query
    .eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach(r => allRecords.push(r));
      fetchNextPage();
    }) // apply each page to all table
    .then(() => allRecords);
}
```

Our app now is be able to load records from Airtable. It should run something like the gif bellow.

![app now loads records](load-records.gif)

Don't you love 🥰 coding? But we should not get ahead of ourselves. We still ned to update that dam path field.

## Resolving Paths

The Table object we creating earlier also exposes a update method that change record fields values without trampling with other data in the record. But to use that we first need to know which records need new path values and first of all what is the path value of a record? Let's think about it.

The most easy case is the records that don't have a parent. On this case we can use the title field as value path. Then if the record indeed has parent, we repeat the check in that parent and go on until we find a record without parent. Based on that, we can write a function that calculate the path for given record. 

``` js
function calcPath(record, records) {
  const findParent = child => child.parent
    ? records.find(child.parent[0])
    : null

  let path = record.title;
  let parent = findParent(record)

  while (parent) {
    path = parent.title + '/' + path;
    parent = findParent(parent);
  }

  return path;
}
```

With can now call calcPath in every record. If the calculated path differs from the one we find at the loaded record., we update the table. Time for another function.

``` js
function updatePaths(records) {
  const updatePromises = [];
  records.forEach(record => {
    const newPath = calcPath(record, records);
    if (record.path !== newPath) {
      const promise = updateRecord(record.id, { path: newPath });
      updatePromises.push(promise);
    }
  });

  return Promise.all(updatePromises);
}
```

Even without knowing how to send the new data to Airtable yet. We could write a minimal version of the the updateRecord function just to check if our algorithm is working proper. We also will ned to update the run function to call updatePaths after loading all the records. Please add the following instructions.

```js
```

## Updating Airtable

Airtable has a rule that won't allow more then five calls per second to its API. If our table find many records to update we be violating that and pushed under a 30 seconds waiting penalty. That definitely is not cool.

Fortunately we can bottleneck package to help us out. Our update function will graciously update under Airtable limits like this.

``` js
import Bottleneck from 'bottleneck';

const MAX_REQUESTS_PER_SECOND = 5;
const SECOND = 1000;
const limiter = new Bottleneck({
  minTime: SECOND / MAX_REQUESTS_PER_SECOND
});

function updateRecord(table, id, entries) {
  return limiter.schedule(() => table.update(id, entries));
};
```

Let's patch everything and now call our function inside the onclick button handler. The new code will be

## Final Thougths

We are not dealing with user input bas input like no data at all. We are dealing with any excepction from select and update Airtable operations. Event the absebce of internet connection could be dealt with. I am leaving this for your brave code skills my friend.

All that the code related what we did here can be found in this git repository. I created a branch for every major step if you want to follow trgouth.

I created an webapp to deal with this tree update for myself with more options like putting status emoji in the path to better order records. The app also deals with the creation of recursive tasks. It is open sourced in this git and open to free use in a very uncommitted way in the url.

I leave you with my best regards. Thanks.