--- 
tags: ['google apps script']
title: How to Create a Dialog to Select Multiple Values in Google Sheets
abstract: Learn how to leverage JavaScript to create dialogs able to select multiple values from other cells inside a Google spreadsheet.
eleventyExcludeFromCollections: true
--- 
Spreadsheets are the probably the most ubiquitous digital tool in the offices around the world. Most of us have a love and hate relationship with them.

One of the things missed for a long tim in then is the ability to select multiples values for a cell. Someway to emulate one to many relationships between different sheets.

Since Google Sheets support scripting using Html and Javascript it is quite easy to implement that feature in a spreadsheet. 

## Prepare The Data

Let's create a simple example with people and team sheets. In this casa a person can be in more than one team.

We populate the data in both sheets and a important detail, link the Data Validation option in the people sheet towards the teams value. This link will be used by our script later.

![data preparation](data-preparation.gif)

## Script Initialization

After that you can click in `Script Editor` submenu inside the `Tools` menu. After the script editor screen opens you click in `File`, then `New` and finally `Script file`. Name it `index`.

The first step is to create a menu option inside the spreadsheet we can use to call our dialog. We do that by creating a `onOpen` function. This will be called automatically.

``` js
function onOpen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const multiselectMenu = { 
    name: 'Select multiple', 
    functionName: 'showSelectDialog'
  }
  ss.addMenu("My Scripts", [multiselectMenu]);
}
```

After saving the script, you can reload the spreadsheet window and the `My Script` menu should already be available.

## Apps Scripts Dialog

The Apps Scripts technology offers a Html service that can render custom dialog and sidebars on top of google apps. We leverage standard html, css and javascript together with google Api to create custom behavior in google spreadsheets for example.

Let's create a html file named `dialog` in the scripts editor to start exploring this feature. Paste the code bellow in the new file.

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

Now to call a dialog with this html we go back to our `index` file and add the `showSelectDialog` function with the code bellow. You can see the code hints to a template engine capability inside Apps Script. This will be useful to us later.  

``` js
function showSelectDialog(){
  const template = HtmlService.createTemplateFromFile('dialog');
  const html = template.evaluate();
  SpreadsheetApp
    .getUi()
    .showModalDialog(html, 'Select multiple');
}
```

You should now be seeing a basic dialog when clicking in `Select multiple`. Google Sheets maybe ask you for authorization to run the script. This could happen more then one time during this project. You can say ok and go. 

The first challenge we have is how to show all teams options the user can select and if some are already present in the cell, present then already selected. So let's write another function inside `index` that grab the validation data for a cell as the database for available options and mark those already selected. See:

``` js
function getOptionsFromCurrentCell(){
  const validOptions = SpreadsheetApp
    .getActiveRange()
    .getDataValidation()
    .getCriteriaValues()[0]
    .getValues()
    .map(value => value[0]);

  const cellData = SpreadsheetApp
    .getActiveRange()
    .getCell(1, 1) // first selected cell in the range
    .getValue();

  const selectedOptions = cellData
    .split(',')
    .map(str => str.trim());
  
  const optionsData = validOptions.map(option => {
    return {
      value: option,
      isSelected: selectedOptions.includes(option)
    }
  })

  return optionsData;
}
```

The Apps Script template engine let us inject data in templates that can be used inside the html. We can take advantage of that and update our `showSelectDialog` function to setup the options before calling the dialog.

``` js
function showSelectDialog(){
  const template = HtmlService.createTemplateFromFile('dialog');
  template.optionsData = getOptionsFromCurrentCell();
  const html = template.evaluate();
  SpreadsheetApp
    .getUi()
    .showModalDialog(html, 'Select multiple');
}
```

Now we need to use that data inside out html to render checkboxes for every option. The template engine cares similar behavior then other typical templates javascript languages. Details can be found [here](https://developers.google.com/apps-script/guides/html/templates).

Let's revisit the html to render the checkboxes. and also create a function to clear or select all items.

``` html
<!DOCTYPE html>
<html>
  <body>
    <? for (const option of optionsData) { ?>
      <input type="checkbox" value="<?= option.value ?>" class="option" <?= option.isSelected && "checked" ?>>
      <label><?= option.value ?></label><br>
    <? } ?>
    <div style="margin-top:10px;">
      <input type="button" value="all" onclick="setAll('check')" />
      <input type="button" value="clear" onclick="setAll('clear')" />
      <input type="button" value="cancel" onclick="google.script.host.close()" />
    </div>
    <script>      
      function setAll(value) {
        const optionsEl = document.querySelectorAll(".option");
        for (const checkbox of optionsEl) {
          checkbox.checked = value === 'check';
        }
      }
    </script>
  </body>
</html>
```

Things are starting to get real. But we need to find a way to send the user selected options back to the spreadsheet. Google consider the dialog we develop as a client app and both the spreadsheet itself and the functions we wrote in the `index` file as the server part. So we need a bridge to comunicate back what the user selected. Gladly this is quite simple.

First let's write a new function in the index file that receives a array of choices as parameter and set that content in the current selected cell.

``` js
function setOptionsForCurrentCell(selectedOptions){
  const cellData = (Array.isArray(selectedOptions) && selectedOptions.length > 0) 
    ? selectedOptions.join(',') 
    : '';
  const cell = SpreadsheetApp.getActiveRange().getCell(1, 1);
  cell.setValue(cellData);  
}
```

Now we have to update out html file to create a apply button and create function that evokes the set function passing the selected options.

``` html
<!DOCTYPE html>
<html>
  <body>
    <? for (const option of optionsData) { ?>
      <input type="checkbox" class="option" value="<?= option.value ?>" <?= option.isSelected && "checked" ?>>
      <label><?= option.value ?></label><br>
    <? } ?>
    <div style="margin-top:10px;">
      <input type="button" value="all" onclick="setAll('check')" />
      <input type="button" value="clear" onclick="setAll('clear')" />
      <input type="button" value="cancel" onclick="google.script.host.close()" />
      <input type="button" value="apply" onclick="apply()" />
    </div>
    <script>      
      function setAll(value) {
        const optionsEl = document.querySelectorAll(".option");
        for (const checkbox of optionsEl) {
          checkbox.checked = value === 'check';
        }
      }

      function apply(){
        const checkedEls = document.querySelectorAll(".option:checked");
        const selectedValues = [];
        for (const checkbox of checkedEls) {
          if (checkbox.checked) {
             selectedValues.push(checkbox.value);
          }
        }
        google.script.run.setOptionsForCurrentCell(selectedValues);
        google.script.host.close();
      }
    </script>
  </body>
</html>
```

You can can see in the `apply` function we called `setOptionsForCurrentCell` via `google.script.run`. Take note this is a asynchronous operation. The run operation offers other options as handlers for failed or success calls. You can read more about that [here](https://developers.google.com/apps-script/guides/html/reference/run).

By now our dialog should be working just fine even if not so elegant designed.

![dialog is now working](dialog-working.gif)

We can improve upon that by styling the dialog and creating a better UI. You will see that if click in the menu in a cell without validation criteria we get a exception. We also could deal better with the asynchronous aspects. But i will leave that outside the scope of this post.

Finally, you can find the full code mentioned here in this GitHub repository.

