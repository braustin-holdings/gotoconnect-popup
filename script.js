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

//All that is occuring in the context will need to be handled in the script
//Install Oauth

const setEvents = (event) => {
  events.push(event);
};

const closeWebSocket = async () => {
  await socket.close();
  window.close();
};

const onMessage = async (event) => {
  const data = JSON.parse(event.data);

  //Waiting for an announce type to avoid duplicate lookup function calls.
  if (data.type === "announce") {
    setEvents(data);
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
    
    if (lines.items) {
      let StringifiedLineInfo = JSON.stringify(lines?.items[0]);
      document.getElementById("lineInfoId").innerText = StringifiedLineInfo;
    }

   
    session = await createSession();

    let stringifiedSessionInfo = JSON.stringify(session);

    document.getElementById("sessionInfo").innerText = stringifiedSessionInfo;
    subscription = await subscribe();
    let stringifiedSubscription = JSON.stringify(subscription);

    document.getElementById("subscribeInfo").innerText =
    stringifiedSubscription;
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
  });
  let initialResponse = lookupResponse;
  const response = await initialResponse.json();
  let callLogContainer = document.getElementById('callLogContainer')
  let message = response.message;
  callEventArray.push(response)
 

  //Decision Log


  let foundDealOrLeads = response?.data
  callEventArray.forEach((response, index) => {
    if(index + 1 < callEventArray.length){
      return
    } else {
      let callLogBox = document.createElement('div')
      callLogBox.style.backgroundColor = 'white'
      callLogBox.style.margin = '20px 30px 30px 30px'
      callLogBox.style.borderRadius = '10px'
      callLogBox.style.padding = '5px'
      callLogContainer.appendChild(callLogBox)

      let flexBox1 = document.createElement('div')
      flexBox1.style.display = 'flex'
      flexBox1.style.alignItems = 'center'
      callLogBox.appendChild(flexBox1)
      let callerTitle = document.createElement('div')
      callerTitle.innerText = 'Caller Information:'
      callerTitle.classList.add('title')
      flexBox1.appendChild(callerTitle)
      let callerDiv = document.createElement('div')
      let callerData = JSON.stringify(response.caller)
      callerDiv.innerText = callerData
      callerDiv.classList.add('callInformation')
      flexBox1.appendChild(callerDiv)
      
      let flexBox2 = document.createElement('div')
      flexBox2.style.display = 'flex'
      flexBox2.style.alignItems = 'center'
      callLogBox.appendChild(flexBox2)

      let calleeTitle = document.createElement('div')
      calleeTitle.innerText = 'Callee Information:'
      calleeTitle.classList.add('title')
      flexBox2.appendChild(calleeTitle)
      let calleeDiv = document.createElement('div')
      let calleeData = JSON.stringify(response.callee)
      calleeDiv.innerText = calleeData
      calleeDiv.classList.add('callInformation')
      flexBox2.appendChild(calleeDiv)
  
      let flexBox3 = document.createElement('div')
      flexBox3.style.display = 'flex'
      flexBox3.style.alignItems = 'center'
      callLogBox.appendChild(flexBox3)

      let directionTitle = document.createElement('div')
      directionTitle.innerText = 'Call Direction:'
      directionTitle.classList.add('title')
      flexBox3.appendChild(directionTitle)
      let callDirectionDiv = document.createElement('div')
      callDirectionDiv.classList.add('callInformation')
      flexBox3.appendChild(callDirectionDiv)
      callDirectionDiv.innerText = response.direction
      
      response.eventLogicProcess.map((event) => {
        console.log('Events are everywhere', event)
        let processInformation = document.createElement('div')
        processInformation.innerText = event
        processInformation.style.color = 'grey'
        callLogBox.appendChild(processInformation)
      })

      
      // let messageTitle = document.createElement('div')
      // messageTitle.innerText = 'Result Message:'
      // messageTitle.classList.add('title')
      // callLogBox.appendChild(messageTitle)

      // let foundInformationMessage = document.createElement("div");
      // foundInformationMessage.innerText = message
      // foundInformationMessage.classList.add('callInformation')
      // callLogBox.appendChild(foundInformationMessage)
        
      console.log('Checking call Event Array', response)
        if(response.type === 'lead'){
          let foundDocument = document.createElement('div')
          foundDocument.style.marginTop = '5px'
          foundDocument.innerText = 'Found Document'
          foundDocument.style.fontSize = '20px'
          callLogBox.appendChild(foundDocument)
          
          let flexBox5 = document.createElement('div')
          flexBox5.style.display = 'flex'
          flexBox5.style.alignItems = 'center'
          flexBox5.style.alignItems = 'center'
          foundDocument.appendChild(flexBox5)

          let leadNameTitle = document.createElement('div')
          leadNameTitle.innerText = 'Title:'
          leadNameTitle.style.fontWeight = 'bold'
          flexBox5.appendChild(leadNameTitle)
          

          let leadName = document.createElement('div')
          leadName.innerText = `${response?.data?.title}`
          flexBox5.appendChild(leadName)


          let flexBox6 = document.createElement('div')
          flexBox6.style.display = 'flex'
          foundDocument.appendChild(flexBox6)

          let leadIdTitle = document.createElement('div')
          leadIdTitle.style.fontWeight = 'bold'
          leadIdTitle.innerText = 'ID:'
          flexBox6.appendChild(leadIdTitle)
          let leadId = document.createElement('div')
          leadId.innerText = `${response.data.id}`
          flexBox6.appendChild(leadId)

          let flexBox7 = document.createElement('div')
          flexBox7.style.display = 'flex'
          foundDocument.appendChild(flexBox7)

          let isArchivedTitle = document.createElement('div')
          isArchivedTitle.innerText = 'Archived?: '
          isArchivedTitle.style.fontWeight = 'bold'
          flexBox7.appendChild(isArchivedTitle)


          let isArchived = document.createElement('div')
          isArchived.innerText = `${response.data.is_archived}`
          flexBox7.appendChild(isArchived)
          
          let flexBox8 = document.createElement('div')
          flexBox8.style.display = 'flex'
          flexBox8.style.alignItems = 'center'
          foundDocument.appendChild(flexBox8)

          let personNameTitle = document.createElement('div')
          personNameTitle.style.fontWeight = 'bold'
          personNameTitle.innerText = 'Persons Name:'
          flexBox8.appendChild(personNameTitle)

          let personName = document.createElement('div')
          personName.innerText = `${response.data.person.name}`
          flexBox8.appendChild(personName)


          let flexBox9 = document.createElement('div')
          flexBox9.style.display = 'flex'
          foundDocument.appendChild(flexBox9)

          let personIdTitle = document.createElement('div')
          personIdTitle.innerText = 'Person ID:'
          personIdTitle.style.fontWeight = 'bold'
          flexBox9.appendChild(personIdTitle)

          let personId = document.createElement('div')
          personId.innerText = `${response.data.id}`
          flexBox9.appendChild(personId)
          
          let flexBox10 = document.createElement('div')
          flexBox10.style.display = 'flex'
          foundDocument.appendChild(flexBox10)

          let ownerIdTitle = document.createElement('div')
          ownerIdTitle.innerText = 'Owner ID:'
          ownerIdTitle.style.fontWeight = 'bold'
          flexBox10.appendChild(ownerIdTitle)

          let ownerId = document.createElement('div')
          ownerId.innerText = `${response.data.owner.id}`
          flexBox10.appendChild(ownerId)
        }
        if(response?.data.length >= 1) {
          response?.data.forEach((response) => {
            
                // foundInformationMessage.appendChild(callDirectionDiv)
                let dataDiv =  document.createElement("div")
                dataDiv.style.marginTop = '10px'
                dataDiv.style.width = 'fit-content'
                dataDiv.style.wordWrap = 'anywhere'
                let dealOrLeadData = JSON.stringify(response)
                // dataDiv.innerText = dealOrLeadData
                dataDiv.classList.add('callInformation')
                callLogBox.appendChild(dataDiv)

                let dealHeading = document.createElement('div')
                dealHeading.innerText = 'Found Document'
                dealHeading.style.fontWeight = 'bold'
                dataDiv.appendChild(dealHeading)


                console.log('Response Data', response.title, response.update_time, response.creator_user_id.id, response.creator_user_id.name, response.creator_user_id.email, response.status)
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
                personDiv.innerText = 'Person Data'
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
                ownerInformation.innerText = 'Owner Information'
                ownerInformation.style.fontWeight = 'bold'
                dataDiv.appendChild(ownerInformation)

                let ownerName = document.createElement('div')
                ownerName.innerText = `Owner Name: ${response.user_id.name}`
                dataDiv.appendChild(ownerName)

                let creatorId = document.createElement('div')
                creatorId.innerText = `Owner Id ${response.user_id.id}`
                dataDiv.appendChild(creatorId)

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
          
        
    }
  })
  
  let { type } = response
  
  if (type === "deal") {
    window.open(
      `https://braustinmobilehomes.pipedrive.com/deal/${response.data[0].id}`,
      "_blank"
    );
  } else if (type === "lead") {
    window.open(
      `https://braustinmobilehomes.pipedrive.com/leads/inbox/${response.data.id}`,
      "_blank"
    );
    
  } else if (type === 'person'){
     window.open(`https://braustinmobilehomes.pipedrive.com/person/${id}`) 
  }
  else {
    console.log("We couldnt determine the type. Sorry...");
  }
};

callApis();
