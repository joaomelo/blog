--- 
tags: ['google apps script']
title: Multi-value Dialogs in Google Sheets
abstract: How to create dialogs to select multiple values for single cells in Google Sheets using Html and JavaScript.
--- 
Spreadsheets are probably the most ubiquitous digital tools in offices around the world. Many of us have a love and hate relationship with them.

One of the things I missed in then for a long time was the ability to select multiples values for a cell. An emulation of one-to-many relationships between different data sets so common in many apps.

Since Google Sheets support scripting using Html and JavaScript, it is quite accessible for web developers to implement that feature in their spreadsheets. 

## Prepare The Data

First, we create a simple example with datasheets for people and team records. In our case, a person can be part of more than one team.

Populate the data in both sheets and set the `Data validation` option in the people sheet for the teams' value range. This link will be crucial to our script later.

![data preparation](/media/2020-05-18-data-preparation.gif)

## Raising a Menu in The Spreadsheet

Now click in the `Script Editor` submenu inside the `Tools` menu. After the script editor screen opens, click in `File`, then `New`, and finally in `Script file`. You can name the file whatever you want, but let us stick with `index` for this post.

The first step is to write some code to create a menu option in the spreadsheet so we can use that to call our future dialog. We do that by creating an `onOpen` function. This name is noted by the spreadsheet and called automatically whenever it opens.

``` js
function onOpen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const multiselectMenu = { 
    name: 'Select multiple', 
    functionName: 'showSelectDialog'
  }
  ss.addMenu("My Scripts", [ multiselectMenu ]);
}
```

For this time only, you need to reload the spreadsheet window after saving the script. The `My Script` menu should be available after that.

## Hello World

The Apps Scripts technology offers an [Html service](https://developers.google.com/apps-script/guides/html) that can render custom dialogs and sidebars on top of Google apps. This is great because we can leverage standard Html, CSS, and JavaScript together with their API to create a new layer of features over Google spreadsheets, for example.

Let's create an Html file named `dialog` in the scripts editor to start exploring this feature. By inserting the code below in the `dialog` file we have a basic custom dialog.

``` html
<!DOCTYPE html>
<html>
  <body>
    <p>Hello World!</p>
    <input 
      type="button" 
      value="cancel" 
      onclick="google.script.host.close()"
    />
  </body>
</html>
```

Unfortunately, we have no way to invoke the dialog UI. Until now 😉. 

To call the dialog, we need to go back to our `index` file and create a `showSelectDialog` function with the code below. You can see that the function hints to a template engine capability. This will be very useful to us in a moment.

``` js
function showSelectDialog(){
  const template = HtmlService
    .createTemplateFromFile('dialog');
  const html = template.evaluate();
  SpreadsheetApp
    .getUi()
    .showModalDialog(html, 'Select multiple');
}
```

We can test the dialog now. Our Hello World should appear whenever we click in the `Select multiple` menu. Google Sheets will probably ask you for authorization to run the script. This could happen more than once during this project. Make sure everything sounds safe and click ok for the scripts to work. 

## Inject Available Options

The challenge now is to settle how to show all teams as options for the user to select. We can also create a mechanism to check if some teams are present in the cell and show them already selected for the user. 

We need another function inside `index` that uses the validation data for a cell as a database for available options. The function could also check if any of the options are already present in the cell and mark those as selected. Happily, Apps Scripts API does most of the heavy lifting for us. See the function. 

``` js
function getOptionsFromCurrentCell(){
  const validOptions = SpreadsheetApp
    .getActiveRange() // everything that is selected
    .getDataValidation() // all validation rules for that
    .getCriteriaValues()[0] // the first criteria
    .getValues() // the value for this criteria
    .map(value => value[0]); // flatten array data

  const selectedOptions = SpreadsheetApp
    .getActiveRange()
    .getCell(1, 1) // first selected cell in the range
    .getValue()
    .split(',') // convert the cell string into an array
    .map(str => str.trim()); // remove unwanted whitespace
  
  const optionsData = validOptions.map(option => {
    return {
      value: option,
      isSelected: selectedOptions.includes(option)
    }
  })

  return optionsData;
}
```

The Apps Script template engine let us inject data in templates before rendering them. The data can then be used inside the template code. Now we update the `showSelectDialog` function to pass the options data we grab in the `getOptionsFromCurrentCell`. Let me show you.

``` js
function showSelectDialog(){
  const template = HtmlService
    .createTemplateFromFile('dialog');
  // pass options data to the template 
  template.optionsData = getOptionsFromCurrentCell();
  const html = template.evaluate();
  SpreadsheetApp
    .getUi()
    .showModalDialog(html, 'Select multiple');
}
```

## Render the Dialog

Now we need to use that options data inside our template to render checkboxes for every option. The Apps Script template engine behaves like other typical JavaScript template languages. Details can be found [here](https://developers.google.com/apps-script/guides/html/templates).

We revisit the `dialog` file to render the checkboxes using `\<?= ?>` and `\<? ?>` special syntax as way to embed JavaScript inside the Html. Then use a standard script tag to write a function to clear or select all items.

``` html
<!DOCTYPE html>
<html>
  <body>
    <? for (const option of optionsData) { ?>
      <input 
        type="checkbox" 
        value="<?= option.value ?>" 
        class="option"
        <?= option.isSelected && "checked" ?>
      >
      <label><?= option.value ?></label><br>
    <? } ?>
    <div style="margin-top:10px;">
      <input 
        type="button" 
        value="all" 
        onclick="setAll('check')" 
      />
      <input 
        type="button" 
        value="clear" 
        onclick="setAll('clear')" 
      />
      <input 
        type="button" 
        value="cancel" 
        onclick="google.script.host.close()"
      />
    </div>
    <script>      
      function setAll(value) {
        const optionsEl = document
          .querySelectorAll(".option");
        for (const checkbox of optionsEl) {
          checkbox.checked = value === 'check';
        }
      }
    </script>
  </body>
</html>
```

Now, the spreadsheet should show all teams when the menu is selected. Notice that the logic is not tied to any particular data. It is based on the validation criteria of the selected cell. Things are starting to get real 😎. 

But we still need a way to send the user-selected options back to the spreadsheet. Google considers the dialog we develop a client app and both the spreadsheet itself and the functions we wrote in the `index` file as the server counterpart. So we need a bridge to communicate back to the server what the user selected. Gladly Apps Script makes it quite simple.

## Update Based on User Selection

First, let's write a new function in the `index` file that receives an array of choices as a parameter and set that content in the currently selected cell.

``` js
function setOptionsForCurrentCell(selectedOptions){
  const hasOptions = Array.isArray(selectedOptions) 
    && selectedOptions.length > 0
  const cellData = hasOptions
    // creates a comma separated string
    ? selectedOptions.join(',')
    : '';
  const cell = SpreadsheetApp.getActiveRange().getCell(1, 1);
  cell.setValue(cellData);  
}
```

Now we update the Html file to create a button and a new function that pass the that to `setOptionsForCurrentCell`.

``` html
<!DOCTYPE html>
<html>
  <body>
    <? for (const option of optionsData) { ?>
      <input 
        type="checkbox" 
        class="option" 
        value="<?= option.value ?>" 
        <?= option.isSelected && "checked" ?>
      >
      <label><?= option.value ?></label><br>
    <? } ?>
    <div style="margin-top:10px;">
      <input 
        type="button" 
        value="all" 
        onclick="setAll('check')"
      />
      <input 
        type="button" 
        value="clear" 
        onclick="setAll('clear')" 
      />
      <input 
        type="button"
        value="cancel"
        onclick="google.script.host.close()"
      />
      <input 
        type="button"
        value="apply"
        onclick="apply()"
      />
    </div>
    <script>      
      function setAll(value) {
        const optionsEl = document
          .querySelectorAll(".option");
        for (const checkbox of optionsEl) {
          checkbox.checked = value === 'check';
        }
      }

      function apply() {
        const checkedEls = document
          .querySelectorAll(".option:checked");
        const selectedValues = [];
        for (const checkbox of checkedEls) {
          if (checkbox.checked) {
             selectedValues.push(checkbox.value);
          }
        }
        google.script.run
          .setOptionsForCurrentCell(selectedValues);
        google.script.host.close();
      }
    </script>
  </body>
</html>
```

You can can see in the `apply` function that we called `setOptionsForCurrentCell` via `google.script.run`. This is an asynchronous operation provided by the Apps Scripts API that offers other options like handlers for failed or successful calls. You can read more about it [here](https://developers.google.com/apps-script/guides/html/reference/run).

By now our program should be working just fine, even if not very visually elegant.

![dialog is now working](/media/2020-05-18-dialog-working.gif)

We can improve upon what we did until here by styling the dialog and creating better UI feedback. You will see that if we select the menu while in a cell without validation criteria, the user will get a confusing exception message. We also could deal better with the asynchronous aspects. But I will leave that outside the scope of this post. Maybe you can give some suggestions in the GitHub repository.

Talking about that, you can find the full code for this project in this [GitHub repository](https://github.com/joaomelo/dialog-to-select-multiple-values-in-google-sheets).