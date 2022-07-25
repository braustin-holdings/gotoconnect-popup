let socket;
let lines = "";
let session = "";
let subscription = "";
let events = [];
let goToConnectAuthToken;
let portalUserAuthToken;
let callEventArray = [];
const nextURL = "/";
let serverURL = "http://localhost:3001";
let oauth;
let eventData 
let createLeadButton = document.createElement('button')
let callLogBox = document.createElement('div')
let callEventReversed


//All that is occuring in the context will need to be handled in the script
//Install Oauth

const setEvents = (event) => {
  events.push(event);
};

const closeWebSocket = async () => {
  await socket.close();
  window.close();
};

//Waiting for an announce type to avoid duplicate lookup function calls.
const onMessage = async (event) => {
  const data = JSON.parse(event.data);
  console.log('DATATATA', data.data)
  eventData = data.data
  if (data.type === "announce") {
    lookup(data);
  } else {
  }
};

async function callApis() {
  //The users toekn from to the smaller app

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  goToConnectClientId = urlParams.get("gotoconnectclientid");
  
  portalUserAuthToken = urlParams.get("portalusertoken");
  if (goToConnectClientId) {
    localStorage.setItem("gotoconnectclientid", goToConnectClientId);
  }
  if (portalUserAuthToken) {
    localStorage.setItem("portalusertoken", portalUserAuthToken);
  }

  
  oauth = new OAuth({
    clientId: localStorage.getItem("gotoconnectclientid"),
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
      calleeTitle.innerText = 'Sales Rep Information:'
      calleeTitle.classList.add('title')
      
     
      let calleeName = document.getElementById('salesRepName')
      calleeName.innerText = `Name: ${lines.items[0].name}` 
     
     
      let calleeNumber = document.getElementById('salesRepExtension')
      calleeNumber.innerText = `Number: ${lines.items[0].number}`
   
  
    // For this tutorial we will use the first line returned from potentially a larger list of lines.
    console.log(firstLine)
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
  createLeadButton.disabled = true
  console.log('We made it', eventData)
  let foundItem = localStorage.getItem('portalusertoken')
  const createdCusty = await fetch(`${serverURL}/api/pipedrive/createCusty`, {
    method: "POST",
    body: JSON.stringify(eventData),
    headers: {
      Authorization: `Bearer ${foundItem}`,
      "Content-Type": "application/json",
    }
  })
}



const lookup = async (eventObj) => {
  let foundItem = localStorage.getItem('portalusertoken')
  console.log(typeof foundItem)
  const lookupResponse = await fetch(`${serverURL}/api/pipedrive`, {
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
  let message = response.message;
  callEventArray.unshift(response)

  
  console.log('Reversed array', callEventArray)
  //Decision Log
  callLogBox.remove()

  callEventArray.forEach((response, index) => {
      console.log(response, index)
      callLogBox = document.createElement('div')
      callLogBox.style.backgroundColor = 'white'
      callLogBox.style.margin = '20px 30px 30px 30px'
      callLogBox.style.borderRadius = '10px'
      callLogBox.style.padding = '5px'
      callLogBox.style.fontSize = '18px'
      callLogContainer.appendChild(callLogBox)

      let timeStamp = document.createElement('div')
      let time = response.time

      timeStamp.innerText = time
      timeStamp.style.fontSize = '20px'
      timeStamp.style.fontWeight = 'bold'
      timeStamp.style.color = '#1b406a'
      callLogBox.appendChild(timeStamp)


      let callerTitle = document.createElement('div')
      callerTitle.innerText = 'Caller Information:'
      callerTitle.classList.add('title')
      callLogBox.appendChild(callerTitle)

      // let callerDiv = document.createElement('div')
      // let callerData = JSON.stringify(response.caller)

      let callerName = document.createElement('div')
      callerName.innerText = ` Name: ${response.caller.name}`
      callLogBox.appendChild(callerName)

      let callerNumber = document.createElement('div')
      callerNumber.innerText = `Number: ${response.caller.number}`
      callLogBox.appendChild(callerNumber)
  

      
      let flexBox3 = document.createElement('div')
      flexBox3.style.display = 'flex'
      flexBox3.style.alignItems = 'center'
      callLogBox.appendChild(flexBox3)

      // let directionTitle = document.createElement('div')
      // directionTitle.innerText = 'Call Direction:'
      // directionTitle.classList.add('title')
      // flexBox3.appendChild(directionTitle)
      // let callDirectionDiv = document.createElement('div')
      // callDirectionDiv.classList.add('callInformation')
      // flexBox3.appendChild(callDirectionDiv)
      // callDirectionDiv.innerText = response.direction
      
     

      

      let eventLogicProcessContainer = document.createElement('div')
      callLogBox.appendChild(eventLogicProcessContainer)
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

      
      // let messageTitle = document.createElement('div')
      // messageTitle.innerText = 'Result Message:'
      // messageTitle.classList.add('title')
      // callLogBox.appendChild(messageTitle)

      // let foundInformationMessage = document.createElement("div");
      // foundInformationMessage.innerText = message
      // foundInformationMessage.classList.add('callInformation')
      // callLogBox.appendChild(foundInformationMessage)
        
        if(response.type === 'lead'){
          // if(response.create) {

          // }
          if(response.requestToCreateCusty) {
           
            createLeadButton.innerText = 'Create A Lead +'
            callLogBox.appendChild(createLeadButton)
            createLeadButton.style.backgroundColor = 'lightGreen'
            createLeadButton.style.borderRadius = '25px'
            createLeadButton.style.padding = '5px'
            createLeadButton.style.fontWeight = 'bold'
            createLeadButton.addEventListener("click", createPDCusty)
            
            
            return
          }
          let foundDocument = document.createElement('div')
          foundDocument.style.marginTop = '15px'
          foundDocument.style.fontSize = '18px'
          foundDocument.innerText = 'Found Document'
          foundDocument.style.fontWeight = 'bold'
          callLogBox.appendChild(foundDocument)

          let leadNameTitle = document.createElement('div')
          leadNameTitle.innerText = `Title: ${response?.data?.title}`
          callLogBox.appendChild(leadNameTitle)
          
          let leadIdTitle = document.createElement('div')
          leadIdTitle.innerText = `ID: ${response.data.id}`
          callLogBox.appendChild(leadIdTitle)

          let isArchivedTitle = document.createElement('div')
          isArchivedTitle.innerText = `Is Archived?: ${response.data.is_archived}`
          callLogBox.appendChild(isArchivedTitle)
          
          let personTab = document.createElement('div')
          personTab.innerText = 'Person'
          personTab.style.fontWeight = 'bold'
          callLogBox.appendChild(personTab)

          let personNameTitle = document.createElement('div')
          personNameTitle.innerText = `Name: ${response.data.person.name}`
          callLogBox.appendChild(personNameTitle)
          
          let personIdTitle = document.createElement('div')
          personIdTitle.innerText = `ID: ${response.data.id}`
          callLogBox.appendChild(personIdTitle)
          
          let ownerTab = document.createElement('div')
          ownerTab.innerText = 'Owner'
          ownerTab.style.fontWeight = 'bold'
          callLogBox.appendChild(ownerTab)

          let ownerIdTitle = document.createElement('div')
          ownerIdTitle.innerText = `ID: ${response.data.owner.id}`
          callLogBox.appendChild(ownerIdTitle)

       
          let goToLeadButton = document.createElement('button')
          goToLeadButton.innerText = 'Open Lead In Pipedrive'
          callLogBox.appendChild(goToLeadButton)
          goToLeadButton.onclick = () => window.open(
            `https://braustinmobilehomes.pipedrive.com/leads/inbox/${response.data.id}`,
            "_blank"
          );

            goToLeadButton.style.backgroundColor = 'lightGreen'
            goToLeadButton.style.borderRadius = '25px'
            goToLeadButton.style.padding = '5px'
            goToLeadButton.style.fontWeight = 'bold'
            goToLeadButton.style.marginTop = '10px'
          
        } else if (response.type === 'person'){
          let foundDocument = document.createElement('div')
          foundDocument.innerText = 'Found Person'
          foundDocument.style.fontWeight = 'bold'
          callLogBox.appendChild(foundDocument)

          let personName = document.createElement('div')
          personName.innerText = `Name: ${response.data.name}`
          callLogBox.appendChild(personName)

          let personId = document.createElement('div')
          personId.innerText = `ID: ${response.data.id}`
          callLogBox.appendChild(personId)

          let phoneNumberTitle = document.createElement('div')
          phoneNumberTitle.innerText = 'Known Phone Numbers:'
          callLogBox.appendChild(phoneNumberTitle)

          response.data.phones.forEach((number) => {
            let phoneNumber = document.createElement('div')
            phoneNumber.innerText = number
            callLogBox.appendChild(phoneNumber)
          })

          let emailTitle = document.createElement('div')
          emailTitle.innerText = 'Emails:'
          callLogBox.appendChild(emailTitle)

          response.data.emails.forEach((email) => {
            let emails = document.createElement('div')
            emails.innerText = email
            callLogBox.appendChild(emails)
          })

          let gotToPersonButton = document.createElement('button')
          gotToPersonButton.innerText = 'Open Person In Pipedrive'
          callLogBox.appendChild(gotToPersonButton)
          gotToPersonButton.onclick = () => window.open(`https://braustinmobilehomes.pipedrive.com/person/${response.data.id}`) 

            gotToPersonButton.style.backgroundColor = 'lightGreen'
            gotToPersonButton.style.borderRadius = '25px'
            gotToPersonButton.style.padding = '5px'
            gotToPersonButton.style.fontWeight = 'bold'
            gotToPersonButton.style.marginTop = '10px'
          
        }
        if(response.type === 'deal') {
          response?.data?.forEach((response) => {
            
                // foundInformationMessage.appendChild(callDirectionDiv)
                let dataDiv =  document.createElement("div")
                dataDiv.style.width = 'fit-content'
                dataDiv.style.wordWrap = 'anywhere'
                dataDiv.style.marginTop = '15px'
                let dealOrLeadData = JSON.stringify(response)
                // dataDiv.innerText = dealOrLeadData
                dataDiv.classList.add('callInformation')
                callLogBox.appendChild(dataDiv)

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
          callLogBox.appendChild(goToDealButton)
          goToDealButton.onclick = () =>  window.open(
            `https://braustinmobilehomes.pipedrive.com/deal/${response.id}`,
            "_blank"
          );

            goToDealButton.style.backgroundColor = 'lightGreen'
            goToDealButton.style.borderRadius = '25px'
            goToDealButton.style.padding = '5px'
            goToDealButton.style.fontWeight = 'bold'
            goToDealButton.style.marginTop = '10px'
          
                

          })
        }
        
        
      //   if (data?.length <= 1) {

      
      //   } else {
      //     let messageTitle = document.createElement('div')
      //     messageTitle.innerText = 'Result Message:'
      //     messageTitle.classList.add('title')
      //     callLogBox.appendChild(messageTitle)

      //     foundInformationMessage.innerText = message
      //     foundInformationMessage.classList.add('callInformation')
      //     callLogBox.appendChild(foundInformationMessage)
        
          // data?.forEach((person) => {
          //   let personInfo = JSON.stringify(person)
          //   let personDiv = document.createElement('div')
          //   personDiv.style.marginTop = '10px'
          //   console.log('personInfo', personInfo)
          //   personDiv.innerText = personInfo
          //   callLogBox.appendChild(personDiv)
          // })
        
  })


  
  let { type } = response

  if (type === "deal") {
    window.open(
      `https://braustinmobilehomes.pipedrive.com/deal/${response.data[0].id}`,
      "_blank"
    );
  } else if (type === "lead" && !response.requestToCreateCusty) {
    window.open(
      `https://braustinmobilehomes.pipedrive.com/leads/inbox/${response.data.id}`,
      "_blank"
    );
    
  } else if (type === 'person'){
     window.open(`https://braustinmobilehomes.pipedrive.com/person/${response.data.id}`) 
  }
  else {
    console.log("We couldnt determine the type. Sorry...");
  }
};

callApis();
