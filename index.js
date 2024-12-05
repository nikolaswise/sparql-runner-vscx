const vscode = require('vscode')
const oxigraph = require('oxigraph')

const toast = (msg) => {
  vscode
  .window
    .showInformationMessage(msg)
}

const isUpdate = (query) => {
  let updateKeys = ['insert', 'delete']
  return updateKeys.some(term => query.toLowerCase().includes(term));
}

const runUpdate = ({store, query}) => {
  let response = store.update(query)

  // Side effect! Show success messages!
  toast(response)
  toast('Update Successful')
  
  return null
}

const getFormat = (query) => {
  let updateKeys = ['construct', 'describe']
  return updateKeys
    .some(term => query.toLowerCase().includes(term)) ? 'nt' : 'json'
}

const runQuery = ({store, query}) => store.query(query, {
  // todo, describe should also be `nt`
  results_format: getFormat(query)
})

const queryStore = ({store, query}) => isUpdate(query)
  ? runUpdate({store, query})
  : runQuery({store, query})


const openInNewDoc = (content) => {
  vscode
    .workspace
    .openTextDocument({
      language: "plaintext",
      content
    }).then(doc => {
      vscode
        .window
        .showTextDocument(doc)
    })
}

function activate(context) {
  // Set up the local in-memory instance of Oxigraph here
  const store = new oxigraph.Store()
  
  // why "disposable"?
  let disposable = vscode
    .commands
    .registerCommand('extension.sparqlRunner', async () => {
      // Grab the activeTextEditor and pull the selection out!
      const editor = vscode.window.activeTextEditor
      const selection = editor.selection
      // Grab the range data from the selection object…
      const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character)
      // And get the text from the range
      const query = editor.document.getText(selectionRange)

      // Send a query to Oxigraph here
      let results
      try {
        results = queryStore({store, query})
      } catch (err) {
        results = err.message
      }

      // Show the response from Oxigraph here
      if (results) {
        openInNewDoc(results)
      }  
    })

    context.subscriptions.push(disposable)
  }

function deactivate() {
  // Tear down the in-memory instance of Oxigraph here?
  // Or do extensions clean themselves up? 
  // Is there a global state I should be using?
}

module.exports = {
	activate,
	deactivate
}

// some sample queries…
// prefix ex: <https://example.com>
// insert data {
//     <uri:0x01> ex:predicate "wow!" .
// }

// select ?s where {
//     ?s ?p ?o
// }

// prefix ex: <https://example.com>
// ask {
//     <uri:0x01> ex:predicate "wow!" .
// }

// construct {
//     ?s ?p ?o
// } where {
//     ?s ?p ?o
// }

// describe <uri:0x01>

// prefix ex: <https://example.com>
// delete data {
//     <uri:0x01> ex:predicate "wow!" .
// }

// prefix ex: <https://example.com>
// ask {
//     <uri:0x01> ex:predicate "wow!" .
// }
