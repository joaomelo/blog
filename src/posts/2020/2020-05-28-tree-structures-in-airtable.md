--- 
tags: ['featured', 'airtable', 'api']
title: Tree Structures in Airtable
abstract: How to arrange Airtable's records in tree structures building an app to update data using their official API.
--- 
[Airtable](https://airtable.com/) is a powerful tool. It has tons of features to edit and visualize data. I use it to organize many of my personal workflows. It is also an amazing prototyping mechanism to test ideas before starting a new app.

The inability to create tree structures with table's records is one of my small frustrations with it. As you can see in the next image, although Airtable is perfectly able to link records in the same table, one cannot order them properly without a way to fill a path string for every item.

![unable to create a tree in airtable](/media/2020-05-28-tree-unable-in-airtable.gif)

The good news is that Airtable offers an API. So, we can set our path field with the power of JavaScript and a couple of libraries. Let me share in this post a way to accomplish that.

## Project Setup

We will use vanilla Html and JavaScript for our project with the help of some packages: 
- [airtable.js](https://github.com/airtable/airtable.js/) is the official library to consume their API; 
- [tailwind](https://tailwindcss.com/) provides utility classes to style our app.

Since we are already talking about packages, don't worry if you are not familiar with Tailwind. It is a CSS framework with an [utility first](https://tailwindcss.com/docs/utility-first/) mentality. You don't need to learn anything about it for our exercise here. Keep calm and carry on aware that a lot of classes will appear in the Html.

If you find yourself lost at any point have no worry. You can go to [this](https://github.com/joaomelo/tree-structures-in-airtable) repository and download the full app. I versioned it in different folders corresponding to each post milestone. 

But enough of talking, let's code. We start with a skeleton `index.html` just pulling the third party packages and our own future script file that will be created in a moment.

``` html
<!DOCTYPE html>
<html>

  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <link href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://unpkg.com/airtable@0.8.1/build/airtable.browser.js"></script>
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

Now create an `index.js` file in the same folder. For now, we write a dummy code just to test if things properly tighten.

``` js
const el = document.getElementById("app");
el.innerHTML = "Hello World!"
```

If you open `index.html` in the local server of your choice, you will see our baby 👶 first step.

## Basic UI

Airtable API needs three basic information: your personal API key, the base id where the given table is located, and the table name. We need to create some inputs to ask that from the user, a button to run our script and a message area to provide feedback. We can update the code inside the `main` tag of our `index.html` with the code below.

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

You can open the app now and cry in frustration since nothing changed 😭. That's because `index.js` is overwriting everything inside `main`. With a small adjustment in the tag id, we change that.

``` js
const div = document.getElementById("logs");
div.innerHTML = "Hello World!"
```

Cool. Now the message is in the logs area and we can move on to pull data directly from Airtable.

## Reading Records from Airtable

Before going to the nitty-gritty of loading records from Airtable, we must install the trigger that starts the whole operation. We do that by assigning a function to our Run button `onclick` property. The function will grab the user input values and ask Airtable for the corresponding table records. In the following code, we declare some helpers functions and make the run button alive. There is also a silly version of what will be our loader function, so we can test the UI.

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
  addLog('run forest run');
}
```

The first step to proper load data is to create a `Table` object using Airtable's library. This object will have the methods needed to update and read from Airtable.

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

Inside `loadRecords`, we use the `select` method from the `Table` object to create a `query` object. The query has an `eachPage` method that paginates through all records in a table applying a provided callback function and returning a Promise at the end. Let's put that design to action to fill an array with records.

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

Yeah! The app can load data from Airtable. It should look like the gif below.

![app now loads records](/media/2020-05-28-load-records.gif)

Don't you love 🥰 coding?! But we should not get ahead of ourselves. We still need to update that damn path field.

## Resolving Paths

The Table object created earlier also exposes an update method that changes provided fields values without trampling with the rest of the record. But to use that we first need to know which records need new path values and first of all, what is the path value of a record? Let's think about it.

The easiest case comes from records that don't have a parent. In these cases, we can use the title field as the path. Then if the record indeed has a parent, we append the parent title to the path of our record and go on checking and aggregating titles until we find an ancestor without a parent. Based on that, we can risk a function that calculates the path for a given record. 

``` js
function calcPath(record, records) {
  const findParent = child => child.fields.parent
    ? records.find(r => r.id === child.fields.parent[0])
    : null;

  let path = record.fields.name;
  let parent = findParent(record);

  while (parent) {
    path = parent.fields.name + '/' + path;
    parent = findParent(parent);
  }

  return path;
}
```

With that, calcPath can be called for every record loaded from Airtable. If the calculated path differs from the original value found at the record, we update the table. Time for another function.

``` js
// ... we change a bit of the run function
  loadRecords(table)
    .then(records => {
      const n = records.length;
      addLog(`loaded ${n} record(s) from ${tableName}`);
      return updatePaths(table, records);
    })
    .then(() => addLog('paths updated'));
}

// and create updatePaths
function updatePaths(table, records) {
  const updatePromises = [];
  records.forEach(record => {
    const newPath = calcPath(record, records);

    if (record.fields.path !== newPath) {
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

Even without knowing how to send the new data to Airtable, yet 😉. We could write a minimal version of the `updateRecord` function just to check if our algorithm is working. Please add the following instructions.

``` js
function updateRecord(table, id, entries) {
  return addLog(`update ${id} to "${entries.path}"`);
};
```

## Updating Airtable

That `table` object we have been talking about has an `update` method to send changes to Airtable. But we need to take care of their rate limits first.

Airtable won't allow more than five calls per second to its API. If at some point the app tries to update many records at once, we will find ourselves been punished with a 30 seconds penalty. That definitely is not cool.

There are gracious ways to secure that, especially with packages like [rxjs](https://rxjs-dev.firebaseapp.com/) and [bottleneck](https://github.com/SGrondin/bottleneck) - make sure to check the second one if you're going seriously into API calls. But we will use a simpler approach by forcing a waiting time before each update call to Airtable using `setTimeout`.

We do that by saving the time of the last API call in a variable outside the function. Then we compare the distance from the present moment to that last call and subtract that distance from a minimal 200 milliseconds interval between calls (1 second divided by the maximum 5 calls per second).

We go on creating a Promise that will resolve with the call to the `update` method, but just when setTimeout is done with the calculated timeout. Finally, we update the `last` variable with the projected future moment when the timeout concludes. I think the code should make it more clear.

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
  return updatePromise;
};
```

I think everything is patched. Test the workflow and check if every record has a shining updated path text field.

![update running smoothly](/media/2020-05-28-path-updating.gif)

## Final Thoughts

There is a ton of stuff that could be improved here. I didn't deal with user invalid inputs or catch any exception from API calls for example. I am leaving these next steps for your brave soul.

If you are interested, I created for myself a web app to run this kind of path update with more options like configurable field names or the ability to inject a status emoji in the path to better order records. The app also creates recursive tasks. It is open-sourced in this GitHub [repository](https://github.com/joaomelo/mytable) and free to use in a very uncommitted way at [mytable.melo.plus](https://mytable.melo.plus).

I leave you with my best regards.