import '@logseq/libs';
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';
// import 'octokit'
import { Octokit, App } from 'octokit'
let githubToken = process.env.GITHUBAUTHENTICATIONTOKEN
const octokit = new Octokit({ auth: `${githubToken}` });
//Inputs 5 numbered blocks when called

var blockArray

const pageName = "Github"
let settings: SettingSchemaDesc[] = [
  {
    key: "API Key",
    type: "string",
    title: "Enter github personal access token",
    description: "Enter your personal access token here",
    default: "user:sawhney17"
  },
  {
    key: "SearchQuery",
    type: "string",
    title: "Enter github search query",
    description: "Enter your desired search query here",
    default: "user:sawhney17"
  },
  {
    key: "TargetPage",
    type: "string",
    title: "Enter target page",
    description: "Enter your desired page, to where the blocks will be inserted",
    default: "Github Issues"
  },
  {
    key: "Block1InsertionTemplate",
    type: "string",
    title: "Insertion template for block 1",
    description: "Enter your desired template for the parent block, created by default for every return value of the query ",
    default: "TODO [Title](URL)"
  },
  {
    key: "Block2InsertionTemplate",
    type: "string",
    title: "Insertion template for block 2",
    description: "Enter your desired template for the child block, created by default for every return value of the query ",
    default: "{Body}"
  }
]
logseq.useSettingsSchema(settings)

function updateSettings() {
  blockArray = logseq.settings.blockTracker
}

function syncSettings() {
  logseq.updateSettings({blockTracker: blockArray })
}
async function fetchGithubIssues(e) {
  console.log('hi')
  console.log()
  octokit.request('GET /search/issues', {
    q: `${logseq.settings.SearchQuery}`,
  }).then((response) => { insertBlocks(response) })
}


function applyTemplate(response, inputString) {
  var finalString = inputString
  console.log("Repo")
  finalString = finalString.replaceAll(/{Title}/gi, response.title)
  finalString = finalString.replaceAll(/{URL}/gi, response.html_url)
  finalString = finalString.replaceAll(/{Body}/gi, response.body)
  console.log(response.repository_url.split("repo/"[1]))
  // finalString = finalString.replaceAll(/{Repo}/gi, response)
  return finalString
}

async function insertBlocks(response) {
  updateSettings()
  console.log(response.data.items)
  for (const dataPoint in response.data.items) {
    console.log(response.data.items[dataPoint].id)
    syncSettings()
    if (blockArray.indexOf(response.data.items[dataPoint].id) == -1) {
      blockArray.push(response.data.items[dataPoint].id)
      syncSettings()

      console.log(dataPoint)
      let page = await logseq.Editor.createPage(logseq.settings.TargetPage, {}, { redirect: true })

      let block1Text = applyTemplate(response.data.items[dataPoint], logseq.settings.Block1InsertionTemplate)
      // console.log(block1Text)
      console.log(block1Text)
      let block1 = await logseq.Editor.insertBlock(page.name, block1Text, { isPageBlock: true })
      logseq.Editor.updateBlock(block1.uuid, `${block1.content}\nid:: ${block1.uuid}\ncollapsed:: true`)
      if (logseq.settings.Block2InsertionTemplate != "") {
        let block2Text = applyTemplate(response.data.items[dataPoint], logseq.settings.Block2InsertionTemplate)
        let block2 = await logseq.Editor.insertBlock(block1.uuid, `${block2Text}`, { sibling: false })

      }
    }
  }
  logseq.App.pushState("page", {
    name: logseq.settings.TargetPage,
  })
}


const main = async () => {
  console.log('plugin loaded');
  logseq.onSettingsChanged(updateSettings)
  logseq.Editor.registerSlashCommand('Github Sync', async (e) => {
    fetchGithubIssues(e)
  }
  )
  if (logseq.settings.blockTracker == undefined) {
    logseq.updateSettings({ blockTracker: [] })
    console.log(logseq.settings.blockTracker)
  }
}

logseq.ready(main).catch(console.error);
