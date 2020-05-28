--- 
tags: ['airtable', 'api']
title: Tree Structures in Airtable
abstract: How to create tree data structures in Airtable using a companion simple App and airtablejs official API.
--- 
[Airtable](https://airtable.com/) is a powerful tool. It has tons of features to edit and visualize data. I use it to organize many of my personal workflows, but is also a amazing prototyping mechanism to test ideas before starting a new app.

One of my small frustrations with it, is the inability to create a tree structure suitable to my needs. As you can see bellow, Airtable is perfectly able to link records in the same table. But i cannot find a way to proper order items without a way to fill a path string in them.

![unable to create tree in airtable](./tree-unable-in-airtable.gif)

The good news is that Airtable offers an API. So, with the power of JavaScript and few packages we can fill out our path field. Let me share a way to accomplish that.

## Project Setup

We will be using vanilla Html and JavaScript for our project with the help of some packages: 
- [Airtable.js](https://github.com/airtable/airtable.js/) is the official package to consume their API; 
- [Rxjs](https://rxjs-dev.firebaseapp.com/) will help us debounce API calls to respect Airtable's imposing limits; 
- [Tailwind](https://tailwindcss.com/) provides utility classes to style our app.

I wrote the code in this post using [Visual Studio Code](https://code.visualstudio.com/) serving files with the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension. 

If you find yourself lost at any point have no worry, you can go to (this)[https://github.com/joaomelo/tree-structures-in-airtable] repository and download the code. I separated it in folders corresponding to each milestone of our app. But enough of talking, let's code.

We start with a skeleton _index.html_ just pulling the third party packages and our own script file that we will create in a moment.

Since we are already talking about packages, don't worry if you are not familiar with Tailwind. It is a css framework with an [utility first](https://tailwindcss.com/docs/utility-first/) mentality. You don't need to learn anything about it for our exercise here. Keep calm and carry on aware that a lot of classes will appear in our html. 

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

Now create an _index.js_ file in the same folder. For now, we write a dummy code just to test if things are proper tighten.

``` js
const el = document.getElementById("app");
el.innerHTML = "Hello World!"
```

If you open _index.html_ in the local server of your choice, you will see our baby 👶 first step.

## Basic UI

Airtable API needs three basic information: your personal API key, the base id where the given table is located and the table name. So we need to create some inputs to ask that from the user, a button to run our script and a message area to provide feedback. We can update the code inside the _main_ tag of our _index.html_ with the code bellow.

``` html
<main id="app">
  <form class="mt-4 border-dashed border p-2">
    <div class="flex items-center mt-4">
      <label for="key" class="w-1/4 block text-gray-500 font-bold text-right mb-0 pr-4">
        Api Key
      </label>
      <input id="key" type="text" class="w-3/4 bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500">
    </div>
    <div class="flex items-center mt-4">
      <label for="base" class="w-1/4 block text-gray-500 font-bold text-right mb-0 pr-4">
        Base ID
      </label>
      <input id="base" type="text" class="w-3/4 bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500">
    </div>
    <div class="flex items-center mt-4">
      <label for="table" class="w-1/4 block text-gray-500 font-bold text-right mb-0 pr-4">
        Table Name
      </label>
      <input id="table" type="text" class="w-3/4 bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500">
    </div>
    <div class="flex justify-center mt-4">
      <button id="run" type="button" class="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Run
      </button>
    </div>
  </form>
  <div id="logs" class="mt-4 mx-2 py-8 bg-gray-100 text-center text-gray-500 font-mono font-bold">
    <p>click "run" to update records</p>
  </div>      
</main>
```

You can open the app now and cry in frustration since nothing changed 😭. That's because _index.js_ is overwriting everything inside _main_. With a small adjustment in the tag id we change that.

``` js
const div = document.getElementById("logs");
div.innerHTML = "Hello World!"
```

Cool. Now the message is in the message area and we can move on to read data directly from Airtable.

## Reading Records from Airtable

Before going to the nitty-gritty of loading records from Airtable, we must install the trigger that starts the whole operation. We do that by assigning a function to our Run button _onclick_ property. The function will grab the user input values and ask Airtable for the corresponding table records. In following code we declare some helpers functions and make the run button alive. There is also a silly version of what will be our loader function, so we can test the UI.

``` js
// where everything starts
byId('run').onclick = () => {
  byId('logs').innerHTML = '';
  run();
}

// helper functions
function byId(id) {
  return document.getElementById(id);
}

function addLog(text) {
  const p = document.createElement('p');
  p.innerText = text;
  byId('logs').appendChild(p);
}

// start of business code
function run() {
  addLog('run forest run')
}
```

Using Airtable library we start by creating a _Table_ object. This object will have the methods we need to read and update data. Create the table object inside the _run_ function and pass it is as argument to a call to _loadRecords_ function.

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
      const n = records.length;
      addLog(`loaded ${n} record(s) from ${tableName}`);
    })  
}
```

Inside _loadRecords_  we use the _select_ method from _Table_ object to create a _query_ object. The query has a _eachPage_ method that paginate through all records in a table applying the callback function you pass to it returning a Promise at the end. See how _loadRecords_ use that to fill an array with records.

``` js
function loadRecords(table) {
  const allRecords = [];
  return table
    .select() // creates the query
    .eachPage((pageRecords, fetchNextPage) => {
      pageRecords.forEach(r => allRecords.push(r));
      fetchNextPage();
    }) // apply callback to all table
    .then(() => allRecords);
}
```

Now the app is be able to load records from Airtable. It should look like as the gif bellow.

![app now loads records](load-records.gif)

Don't you love 🥰 coding?! But we should not get ahead of ourselves. We still need to update that damn path field.

## Resolving Paths

The Table object created earlier also exposes an update method that change provided fields values without trampling with the rest of the record. But to use that, we first need to know which records need new path values and first of all, what is the path value of a record? Let's think about it.

The most easy case came from records that don't have a parent. On this case we can use the title field as the path. Then if the record indeed has a parent, we append the parent title to the path of our record and go on checking and aggregating titles until we find a ancestor without parent. Based on that, write a function that calculate the path for given record. 

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

With that, calcPath can be called for every record loaded from Airtable. If the calculated path differs from the one found at the record original data, we update the table. Time for another function.

``` js
// ... we change a bit of the run function
  loadPromise
  .then(records => {
    const n = records.length;
    addLog(`loaded ${n} record(s) from ${tableName}`);
    return updatePaths(table, records);
  })
  .then(() => addLog('updated paths'));
}

// and create updatePaths
function updatePaths(table, records) {
  const updatePromises = [];
  records.forEach(record => {
    const newPath = calcPath(record, records);

    if (record.fields.path !== path) {
      const promise = updateRecord(table, 
        record.id, 
        { path: newPath }
      );
      updatePromises.push(promise);
    }
  });

  return Promise.all(updatePromises);
}
```

Even without knowing how to send the new data to Airtable yet. We could write a minimal version of the the _updateRecord_ function just to check if our algorithm is working proper. Please add the following instructions.

``` js
function updateRecord(table, id, entries) {
  return addLog(`update ${id} to "${entries.path}"`);
};
```

## Updating Airtable

That table object we been talking about has a _update_ method send changes to Airtable. But we need to take care of rate limits first.

Airtable won't allow more than five calls per second to its API. If at some poiny our+ table have many records to update we will find ourselves violating that rule and been punished with a 30 seconds waiting penalty. That definitely is not cool.

There are graciously ways to secure that, specially with packages like rxjs and bottleneck - make sure to check the second one if you going seriously into API calls. But we will use a simpler approach just forcing a waiting time before each update call to Airtable using setTimeout.

We do that be saving the last call in a variable outside the function. Then we compare the distance from the present moment to that last call and subtract that distance from the minimal 200 minimal milliseconds interval between calls (1 second divided by our maximum 5 calls).

Then we call setTimeout passing a promise that will resolve invoking the table update method, but just after the calculated timeout. Finally, we update the last variable with the projected time in the future the timeout will end. Here the code.


``` js
let last;
function updateRecord(table, id, entries) {
  const interval = 200;
  const now = Date.now();
  const passed = last ? now - last : interval;
  const timeout = interval - passed;  
  
  const updatePromise = new Promise(resolve => 
    setTimeout(
      () => resolve(table.update(id, entries)),
      timeout
    )
  );

  last = now + timeout;  
  return updatePromise
};
```

I think everything is patched. Test the workflow and check if every record has a shining updated path text field.

![update running smoothly](path-updating.gif)

## Final Thougths

We are not dealing with user input bas input like no data at all. We are dealing with any excepction from select and update Airtable operations. Event the absebce of internet connection could be dealt with. I am leaving this for your brave code skills my friend.

If you are interested, i created an webapp to deal with this tree update for myself with more options like configurable field names, the ability  to inject a status emoji in the path to better order records. The app also deals with the creation of recursive tasks. It is open sourced in this git and welcome to free usage in a very uncommitted way at [mytable.melo.plus](https://mytable.melo.plus).

I leave you with my best regards.