let socket
let lines
let session
let subscription
let events = []
let goToConnectAuthToken
let portalUserAuthToken
let callEventArray = []
const nextURL = "/"
let oauth
let eventData 
let callLogBox = document.createElement('div')

let createLeadButton
let stopListeningButton = document.getElementById('stopListeningButton')
import envVars from "./envVars.js"

//All that is occuring in the context will need to be handled in the script
//Install Oauth

const setEvents = (event) => {
  events.push(event);
};

const closeWebSocket =  async () => {
  await socket.close();
  window.close();
};

stopListeningButton.addEventListener('click', closeWebSocket)
//Waiting for an announce type to avoid duplicate lookup function calls.
const onMessage = async (event) => {
  const data = JSON.parse(event.data);
  
  if(data.data != undefined || data.data != null){
    eventData = data.data
  } else {
    return
  }
  if (data.type === "announce") {
    lookup(data);
  } else {
  }
};

async function callApis() {
  //The users toekn from to the smaller app

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  
  portalUserAuthToken = urlParams.get("portalusertoken");
  if (portalUserAuthToken) {
    localStorage.setItem("portalusertoken", portalUserAuthToken);
  }

  oauth = new OAuth({
    clientId: "d303fe6e-15db-4b2c-a91a-e8e470a4869d",
  });

  oauth.getToken().then(async (token) => {
    history.replaceState({ id: 1 }, "", nextURL);
    goToConnectAuthToken = token;
    lines = await getLineInfo();
   
    session = await createSession();

    subscription = await subscribe();

    socket = new WebSocket(session.ws);
    socket.addEventListener("message", onMessage);
  
  }); 
}

async function getLineInfo() {
  const response = await fetch("https://api.jive.com/users/v1/lines", {
    headers: { Authorization: `Bearer ${goToConnectAuthToken}` },
  });
  return response.json();
}

async function createSession() {
  const response = await fetch("https://realtime.jive.com/v2/session", {
    headers: { Authorization: `Bearer ${goToConnectAuthToken}` },
    method: "POST",
  });
  return response.json();
}

async function subscribe() {
  if (lines.items) {
    const firstLine = lines?.items[0];

    let calleeTitle = document.getElementById('salesRepTitle')
      calleeTitle.innerText = 'Currently Signed:'
      calleeTitle.classList.add('title')
      
    let box = document.getElementById('box')
   

     let salesRepNameContainer = document.createElement('div')
     salesRepNameContainer.style.display = 'flex'
     salesRepNameContainer.style.alignItems = 'center'
     salesRepNameContainer.style.marginTop = '5px'
     box.appendChild(salesRepNameContainer)

     let salesRepIcon = document.createElement('i')
     salesRepIcon.classList.add('fa-solid')
     salesRepIcon.classList.add('fa-user')
     salesRepIcon.classList.add('icon')
     salesRepIcon.style.marginRight = '7px'
     salesRepNameContainer.appendChild(salesRepIcon)

  

      let calleeName = document.createElement('div')
      calleeName.innerText = `${lines.items[0].name}`
      calleeName.classList.add('lineInformation')
      salesRepNameContainer.appendChild(calleeName)

      let extensionContainer = document.createElement('div')
      extensionContainer.style.display = 'flex'
      extensionContainer.style.alignItems = 'center'
      extensionContainer.style.marginTop = '10px'
      box.appendChild(extensionContainer)
     
      let phoneIcon = document.createElement('i')
      phoneIcon.classList.add('fa-phone')
      phoneIcon.classList.add("fa-solid")
      phoneIcon.classList.add('icon')
      phoneIcon.style.marginRight = '7px'
      extensionContainer.appendChild(phoneIcon)

      let calleeNumber = document.createElement('div')
      calleeNumber.innerText = `${lines.items[0].number}`
      calleeNumber.classList.add('lineInformation')
      extensionContainer.appendChild(calleeNumber)
  
    // For this tutorial we will use the first line returned from potentially a larger list of lines.
    const account = firstLine.organization.id;

    const data = JSON.stringify([
      {
        id: "mylinesubscription",
        type: "dialog",
        entity: {
          account: account,
          type: "line.v2",
          id: firstLine.id,
        },
      },
    ]);

    const response = await fetch(session.subscriptions, {
      headers: {
        Authorization: `Bearer ${goToConnectAuthToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: data,
    });
    return response.json();
  }
}

const createPDCusty = async (eventObj) => {
  
  console.log('We made it', eventData)
  let foundItem = localStorage.getItem('portalusertoken')
  const createdCusty = await fetch(`http://localhost:3001/api/pipedrive/createCusty`, {
    method: "POST",
    body: JSON.stringify(eventData),
    headers: {
      Authorization: `Bearer ${foundItem}`,
      "Content-Type": "application/json",
    }
  })
  let response = await createdCusty.json()
  window.open(
    `https://braustinmobilehomes.pipedrive.com/leads/inbox/${response.data.id}`,
    "_blank"
  );
  return response
}



const lookup = async (eventObj) => {
  let foundItem = localStorage.getItem('portalusertoken')
  
  const lookupResponse = await fetch(`http://localhost:3001/api/pipedrive`, {
    method: "POST",
    body: JSON.stringify(eventObj),
    headers: {
      Authorization: `Bearer ${foundItem}`,
      "Content-Type": "application/json",
    },
  }
  );

  let initialResponse = lookupResponse;
  const response = await initialResponse.json();

  
  let callLogContainer = document.getElementById('callLogContainer')
  callLogContainer.innerHTML = ''
  callEventArray.unshift(response)
  //Decision Log
  callEventArray.forEach((response, index) => {
  
    let inboundCallContainer = document.createElement('div')
    inboundCallContainer.style.display = 'flex'
    callLogBox.appendChild(inboundCallContainer)
    let timeStamp = document.createElement('div')
    let time = response.time

    timeStamp.innerText = `Inbound Call @ ${time}`
    timeStamp.style.fontSize = '20px'
    timeStamp.style.fontWeight = 'bold'
    timeStamp.style.color = '#1b406a'
    inboundCallContainer.appendChild(timeStamp)

    // let callerDiv = document.createElement('div')
    // let callerData = JSON.stringify(response.caller)
    let callerInfoBox1 = document.createElement('div')

    callerInfoBox1.style.display = 'flex'
    callerInfoBox1.style.alignItems = 'center'
    inboundCallContainer.appendChild(callerInfoBox1)
    let callerIcon = document.createElement('i')
    callerIcon.classList.add('fa-solid')
    callerIcon.classList.add('fa-user')
    callerIcon.classList.add('icon')
    callerIcon.style.marginRight = '7px'

    callerInfoBox1.appendChild(callerIcon)
    let callerName = document.createElement('div')
    callerName.innerText = `${response?.caller.name}`
    callerName.style.fontWeight = 'bold'
    callerInfoBox1.appendChild(callerName)

    let callerInfoBox2 = document.createElement('div')
    callerInfoBox2.style.display = 'flex'
    callerInfoBox2.style.alignItems = 'center'
    callerInfoBox2.style.marginTop = '10px'
    inboundCallContainer.appendChild(callerInfoBox2)

  let phoneIcon = document.createElement('i')
    phoneIcon.classList.add('fa-phone')
    phoneIcon.classList.add("fa-solid")
    phoneIcon.classList.add('icon')
    phoneIcon.style.marginRight = '7px'
    callerInfoBox2.appendChild(phoneIcon)

  let callerNumber = document.createElement('div')
  callerNumber.innerText = `${response?.caller.number}`
  callerNumber.style.fontWeight = 'bold'
  callerInfoBox2.appendChild(callerNumber)



      callLogBox.style.backgroundColor = 'white'
      callLogBox.style.margin = '20px 30px 30px 30px'
      callLogBox.style.borderRadius = '10px'
      callLogBox.style.padding = '5px'
      callLogBox.style.fontSize = '18px'
      callLogBox.classList.add('callLogBox')
      callLogBox.setAttribute('data-id', index)
      callLogContainer.appendChild(callLogBox)

      let innerCallLogBox = document.createElement('div')
      innerCallLogBox.classList.add('innerCallLogBox')
      callLogBox.appendChild(innerCallLogBox)

     
      //TODO: This is where we should create a new container

      

        if(response.type === 'lead'){
          if(response.requestToCreateCusty) {

            let inputContainer = document.createElement('div')
            inputContainer.style.display = 'flex'
            inputContainer.style.flexDirection = 'column'

            innerCallLogBox.appendChild(inputContainer)

            let inputNameLabel = document.createElement('label')
            inputNameLabel.setAttribute('aria-label', 'Enter a name for the newly created lead.')
            
            let inputPhoneNumberLabel = document.createElement('label')
            inputPhoneNumberLabel.setAttribute('aria-label', 'Enter a phone number for the newly created lead.')
            
              

            
            let inputTitle = document.createElement('div')
            inputTitle.innerText = '**NOTE: Fill out the input boxes below if you want to manually input the information used to create a lead otherwise by clicking the create lead button it will use the information from the call.'
            inputTitle.style.width = '50%'

            inputContainer.appendChild(inputTitle)

            inputContainer.appendChild(inputNameLabel)
            inputContainer.appendChild(inputPhoneNumberLabel)

            let nameInputBox = document.createElement('input')
            nameInputBox.setAttribute('placeholder', 'Name')
            nameInputBox.setAttribute('id', 'nameInput')
            nameInputBox.classList.add('inputBox')

            let phoneNumberInputBox = document.createElement('input')
            phoneNumberInputBox.setAttribute('placeholder', 'Phone Number')
            phoneNumberInputBox.setAttribute('type', 'tel')
            phoneNumberInputBox.setAttribute('id', 'phoneNumberInput')
            phoneNumberInputBox.classList.add('inputBox')
            
            inputNameLabel.appendChild(nameInputBox)
            inputPhoneNumberLabel.appendChild(phoneNumberInputBox)
            
            createLeadButton.classList.add('goToButton')
            createLeadButton = document.createElement('button')
            createLeadButton.setAttribute('data-id', index)
            createLeadButton.innerText = 'Create A Lead +'

            createLeadButton.addEventListener("click", async (e) => {
              console.log(nameInputBox.value, phoneNumberInputBox.value)
              let manuallyInputedLead = {
                  name: nameInputBox.value,
                  phoneNumber: phoneNumberInputBox.value
              }
              eventData = {
                ...eventData, 
                leadInput: {...manuallyInputedLead}
              }
              response.type = 'newlyCreatedLead'
              response.requestToCreateCusty = false
              
              let value  = e.target.getAttribute('data-id')
              const parentCallLogBox = document.querySelector(`[data-id="${value}"]`)
              e.target.disabled = true
              
              let createPDCustyResponse = await createPDCusty()
              response.data = createPDCustyResponse 
      
            let foundDocument = document.createElement('div')
            
            foundDocument.style.marginTop = '15px'
            foundDocument.style.fontSize = '18px'
            foundDocument.innerText = 'Congrats a lead was created and contains the following information!'
            foundDocument.style.fontWeight = 'bold'
            parentCallLogBox.appendChild(foundDocument)

            let leadNameTitle = document.createElement('div')
            leadNameTitle.innerText = `Title: ${createPDCustyResponse?.data?.title}`
            parentCallLogBox.appendChild(leadNameTitle)
            
            let leadIdTitle = document.createElement('div')
            leadIdTitle.innerText = `ID: ${createPDCustyResponse.data.id}`
            parentCallLogBox.appendChild(leadIdTitle)

            let isArchivedTitle = document.createElement('div')
            isArchivedTitle.innerText = `Is Archived?: ${createPDCustyResponse.data.is_archived}`
            parentCallLogBox.appendChild(isArchivedTitle)
            
            let personTab = document.createElement('div')
            personTab.innerText = 'Person'
            personTab.style.fontWeight = 'bold'
            parentCallLogBox.appendChild(personTab)

            let personIdTitle = document.createElement('div')
            personIdTitle.innerText = `ID: ${createPDCustyResponse.data.id}`
            parentCallLogBox.appendChild(personIdTitle)
            
            let ownerTab = document.createElement('div')
            ownerTab.innerText = 'Owner'
            ownerTab.style.fontWeight = 'bold'
            parentCallLogBox.appendChild(ownerTab)

            let ownerIdTitle = document.createElement('div')
            ownerIdTitle.innerText = `ID: ${createPDCustyResponse.data.owner_id}`
            parentCallLogBox.appendChild(ownerIdTitle)

        
            let goToLeadButton = document.createElement('button')
            goToLeadButton.innerText = 'Open Lead In Pipedrive'
            parentCallLogBox.appendChild(goToLeadButton)
              goToLeadButton.classList.add('goToButton')
              goToLeadButton.onclick = () => window.open(
                `https://braustinmobilehomes.pipedrive.com/leads/inbox/${createPDCustyResponse.data.id}`,
                "_blank"
              );
            })
              innerCallLogBox.appendChild(createLeadButton)
              return
          }
          let foundDocument = document.createElement('div')
          foundDocument.style.marginTop = '15px'
          foundDocument.style.fontSize = '18px'
          foundDocument.innerText = 'Found Document'
          foundDocument.style.fontWeight = 'bold'
          innerCallLogBox.appendChild(foundDocument)

          let leadNameTitle = document.createElement('div')
          leadNameTitle.innerText = `Title: ${response?.data?.title}`
          innerCallLogBox.appendChild(leadNameTitle)
          
          let leadIdTitle = document.createElement('div')
          leadIdTitle.innerText = `ID: ${response?.data?.id}`
          innerCallLogBox.appendChild(leadIdTitle)

          let isArchivedTitle = document.createElement('div')
          isArchivedTitle.innerText = `Is Archived?: ${response?.data?.is_archived}`
          innerCallLogBox.appendChild(isArchivedTitle)
          
          let personTab = document.createElement('div')
          personTab.innerText = 'Person'
          personTab.style.fontWeight = 'bold'
          innerCallLogBox.appendChild(personTab)

          let personNameTitle = document.createElement('div')
          personNameTitle.innerText = `Name: ${response?.data?.person.name}`
          innerCallLogBox.appendChild(personNameTitle)
          
          let personIdTitle = document.createElement('div')
          personIdTitle.innerText = `ID: ${response?.data?.id}`
          innerCallLogBox.appendChild(personIdTitle)
          
          let ownerTab = document.createElement('div')
          ownerTab.innerText = 'Owner'
          ownerTab.style.fontWeight = 'bold'
          innerCallLogBox.appendChild(ownerTab)

          let ownerIdTitle = document.createElement('div')
          ownerIdTitle.innerText = `ID: ${response?.data?.owner?.id}`
          innerCallLogBox.appendChild(ownerIdTitle)

       
          let goToLeadButton = document.createElement('button')
          goToLeadButton.innerText = 'Open Lead In Pipedrive'
          innerCallLogBox.appendChild(goToLeadButton)
          goToLeadButton.onclick = () => window.open(
            `https://braustinmobilehomes.pipedrive.com/leads/inbox/${response.data.id}`,
            "_blank"
          );
            goToLeadButton.classList.add('goToButton')
          
        } else if (response.type === 'person'){
          let foundDocument = document.createElement('div')
          foundDocument.innerText = 'Found Person'
          foundDocument.style.fontWeight = 'bold'
          innerCallLogBox.appendChild(foundDocument)

          let personName = document.createElement('div')
          personName.innerText = `Name: ${response.data.name}`
          innerCallLogBox.appendChild(personName)

          let personId = document.createElement('div')
          personId.innerText = `ID: ${response.data.id}`
          innerCallLogBox.appendChild(personId)

          let phoneNumberTitle = document.createElement('div')
          phoneNumberTitle.innerText = 'Known Phone Numbers:'
          innerCallLogBox.appendChild(phoneNumberTitle)

          response.data.phones.forEach((number) => {
            let phoneNumber = document.createElement('div')
            phoneNumber.innerText = number
            innerCallLogBox.appendChild(phoneNumber)
          })

          let emailTitle = document.createElement('div')
          emailTitle.innerText = 'Emails:'
          innerCallLogBox.appendChild(emailTitle)

          response.data.emails.forEach((email) => {
            let emails = document.createElement('div')
            emails.innerText = email
            innerCallLogBox.appendChild(emails)
          })

          let gotToPersonButton = document.createElement('button')
          gotToPersonButton.innerText = 'Open Person In Pipedrive'
          innerCallLogBox.appendChild(gotToPersonButton)
          gotToPersonButton.onclick = () => window.open(`https://braustinmobilehomes.pipedrive.com/person/${response.data.id}`) 
            gotToPersonButton.classList.add('goToButton')
        } else if(response.type === 'deal') {
          response?.data?.forEach((response) => {
            
                // foundInformationMessage.appendChild(callDirectionDiv)
                let dataDiv =  document.createElement("div")
                dataDiv.style.width = 'fit-content'
                dataDiv.style.wordWrap = 'anywhere'
                dataDiv.style.marginTop = '15px'
                let dealOrLeadData = JSON.stringify(response)
                // dataDiv.innerText = dealOrLeadData
                dataDiv.classList.add('callInformation')
                innerCallLogBox.appendChild(dataDiv)

                let dealHeading = document.createElement('div')
                dealHeading.innerText = 'Found Document'
                dealHeading.style.fontWeight = 'bold'
                dataDiv.appendChild(dealHeading)

                let titleHeading = document.createElement('div')
                titleHeading.innerText = `Title: ${response.title}`
                dataDiv.appendChild(titleHeading)

                let dealId = document.createElement('div')
                dealId.innerText = `ID: ${response.id}`
                dataDiv.appendChild(dealId)

                let status = document.createElement('div')
                status.innerText = `Status: ${response.status}`
                dataDiv.appendChild(status)

                let lastUpdatedHeading = document.createElement('div')
                lastUpdatedHeading.innerText = `Last Updated: ${response.update_time}`
                dataDiv.appendChild(lastUpdatedHeading)
              
                let personDiv = document.createElement('div')
                personDiv.innerText = 'Person'
                personDiv.style.fontWeight = 'bold'
                dataDiv.appendChild(personDiv)

                let personName = document.createElement('div')
                personName.innerText = ` Name: ${response.person_id.name}`
                let personId = document.createElement('div')
                personId.innerText = `ID: ${response.person_id.value}`
                dataDiv.appendChild(personName)
                dataDiv.appendChild(personId)

                let personPhoneNumber = document.createElement('div')
                personPhoneNumber.innerText = `Phone Number: ${response.person_id.phone[0].value}`
                dataDiv.appendChild(personPhoneNumber)

                let ownerInformation = document.createElement('div')
                ownerInformation.innerText = 'Owner'
                ownerInformation.style.fontWeight = 'bold'
                dataDiv.appendChild(ownerInformation)

                let ownerName = document.createElement('div')
                ownerName.innerText = `Owner Name: ${response.user_id.name}`
                dataDiv.appendChild(ownerName)

                let creatorId = document.createElement('div')
                creatorId.innerText = `Owner Id ${response.user_id.id}`
                dataDiv.appendChild(creatorId)


                let goToDealButton = document.createElement('button')
          goToDealButton.innerText = 'Open Deal In PipeDrive'
          innerCallLogBox.appendChild(goToDealButton)
          goToDealButton.onclick = () =>  window.open(
            `https://braustinmobilehomes.pipedrive.com/deal/${response.id}`,
            "_blank"
          );
            goToDealButton.classList.add("goToButton")
          })
        } else if(response.type === "newlyCreatedLead"){
          let foundDocument = document.createElement('div')
          
          foundDocument.style.marginTop = '15px'
          foundDocument.style.fontSize = '18px'
          foundDocument.innerText = 'Congrats a lead was created and contains the following information!'
          foundDocument.style.fontWeight = 'bold'
          innerCallLogBox.appendChild(foundDocument)

          let leadNameTitle = document.createElement('div')
          leadNameTitle.innerText = `Title: ${response?.data?.data.title}`
          innerCallLogBox.appendChild(leadNameTitle)
          
          let leadIdTitle = document.createElement('div')
          leadIdTitle.innerText = `ID: ${response?.data?.data.id}`
          innerCallLogBox.appendChild(leadIdTitle)

          let isArchivedTitle = document.createElement('div')
          isArchivedTitle.innerText = `Is Archived?: ${response?.data?.data?.is_archived}`
          innerCallLogBox.appendChild(isArchivedTitle)
          
          let personTab = document.createElement('div')
          personTab.innerText = 'Person'
          personTab.style.fontWeight = 'bold'
          innerCallLogBox.appendChild(personTab)

          let personIdTitle = document.createElement('div')
          personIdTitle.innerText = `ID: ${response?.data?.data?.id}`
          innerCallLogBox.appendChild(personIdTitle)
          
          let ownerTab = document.createElement('div')
          ownerTab.innerText = 'Owner'
          ownerTab.style.fontWeight = 'bold'
          innerCallLogBox.appendChild(ownerTab)

          let ownerIdTitle = document.createElement('div')
          ownerIdTitle.innerText = `ID: ${response?.data?.data?.owner_id}`
          innerCallLogBox.appendChild(ownerIdTitle)

       
          let goToLeadButton = document.createElement('button')
          goToLeadButton.innerText = 'Open Lead In Pipedrive'
          innerCallLogBox.appendChild(goToLeadButton)
            goToLeadButton.classList.add("goToButton")
        }
  })

  let eventLogicProcessContainer = document.createElement('div')
      eventLogicProcessContainer.classList.add('eventLogicContainer')
      callLogBox.appendChild(eventLogicProcessContainer)
      let eventTitle = document.createElement('div')
      eventTitle.innerText = 'Events'
      eventTitle.classList.add('eventTitle')
      eventLogicProcessContainer.appendChild(eventTitle)
      eventLogicProcessContainer.style.margin = '10px 0 10px 0'
      response?.eventLogicProcess?.map((event) => {
        let processInformation = document.createElement('div')
        processInformation.innerText = event
        if(event.includes('found')) {
          processInformation.style.color = 'green'
        } else {
          processInformation.style.color = 'red'
        }
        eventLogicProcessContainer.appendChild(processInformation)
      })
  let { type } = response

  if (type === "deal") {
    window.open(
      `https://braustinmobilehomes.pipedrive.com/deal/${response?.data[0].id}`,
      "_blank"
    );
  } else if (type === "lead" && response.requestToCreateCusty != true) {
    window.open(
      `https://braustinmobilehomes.pipedrive.com/leads/inbox/${response?.data?.id}`,
      "_blank"
    );
    
  } else if (type === 'person'){
     window.open(`https://braustinmobilehomes.pipedrive.com/person/${response?.data.id}`) 
  }
  else {
    console.log("We couldnt determine the type. Sorry...");
  }
};

callApis();
