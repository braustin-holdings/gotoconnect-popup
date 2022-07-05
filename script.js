let socket;
let ready = false;
let lines = "";
let session = "";
let subscription = "";
let events = [];
let goToConnectAuthToken;
let portalUserAuthToken;
let callEventArray = []
const nextURL = "/"


const setEvents = (event) => {
  events.push(event);
  ready = true;
};



const closeWebSocket = () => {
  socket.close()
  window.close()
}

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
  goToConnectAuthToken = urlParams.get("gotoconnecttoken");
  portalUserAuthToken = urlParams.get("portalusertoken");
  history.replaceState({id: 1}, '', nextURL)
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

  document.getElementById("subscribeInfo").innerText = stringifiedSubscription;
  socket = new WebSocket(session.ws);
  socket.addEventListener("message", onMessage);
  ready = true;
}

const lookup = async (eventObj) => {
  const lookupResponse = await fetch("http://localhost:3001/api/pipedrive", {
    method: "POST",
    body: JSON.stringify(eventObj),
    headers: {
      Authorization: `Bearer ${portalUserAuthToken}`,
      "Content-Type": "application/json",
    },
  });
  let response = lookupResponse;
  const json = await response.json();
  callEventArray.push(json)
  let callLogContainer = document.getElementById('callLogContainer')
  let message = json.message;
  let data = json?.data?.data.items;
 
  callEventArray.forEach((call, index) => {
    if(index + 1 < callEventArray.length){
      return
    } else {
      let callLogBox = document.createElement('div')
      callLogBox.style.backgroundColor = 'white'
      callLogBox.style.margin = '20px 30px 30px 30px'
      callLogBox.style.borderRadius = '10px'
      callLogBox.style.padding = '5px'
      callLogContainer.appendChild(callLogBox)

      let callerTitle = document.createElement('div')
      callerTitle.innerText = 'Caller Information:'
      callerTitle.classList.add('title')
      callLogBox.appendChild(callerTitle)
      let callerDiv = document.createElement('div')
      let callerData = JSON.stringify(call.caller)
      callerDiv.innerText = callerData
      callerDiv.classList.add('callInformation')
      callLogBox.appendChild(callerDiv)
      
      let calleeTitle = document.createElement('div')
      calleeTitle.innerText = 'Callee Information:'
      calleeTitle.classList.add('title')
      callLogBox.appendChild(calleeTitle)
      let calleeDiv = document.createElement('div')
      let calleeData = JSON.stringify(call.callee)
      calleeDiv.innerText = calleeData
      calleeDiv.classList.add('callInformation')
      callLogBox.appendChild(calleeDiv)
  
      let directionTitle = document.createElement('div')
      directionTitle.innerText = 'Call Direction:'
      directionTitle.classList.add('title')
      callLogBox.appendChild(directionTitle)
      let callDirectionDiv = document.createElement('div')
      callDirectionDiv.classList.add('callInformation')
      callDirectionDiv.innerText = call.direction
     
      callLogBox.appendChild(callDirectionDiv)
      
        let foundInformationMessage = document.createElement("div");
      
        if (data?.length <= 1) {
          let messageTitle = document.createElement('div')
          messageTitle.innerText = 'Result Message:'
          messageTitle.classList.add('title')
          callLogBox.appendChild(messageTitle)

          foundInformationMessage.innerText = message
          foundInformationMessage.classList.add('callInformation')
          callLogBox.appendChild(foundInformationMessage)
          // foundInformationMessage.appendChild(callDirectionDiv)
      
          let dataDiv =  document.createElement("div")
          let foundDealsOrLeads = JSON.stringify(call.data.data) 
          dataDiv.innerText = foundDealsOrLeads;
          dataDiv.classList.add('callInformation')
          foundInformationMessage.appendChild(dataDiv)
      
        } else {
          let messageTitle = document.createElement('div')
          messageTitle.innerText = 'Result Message:'
          messageTitle.classList.add('title')
          callLogBox.appendChild(messageTitle)

          foundInformationMessage.innerText = message
          foundInformationMessage.classList.add('callInformation')
          callLogBox.appendChild(foundInformationMessage)
          data.forEach((person) => {
            let personInfo = JSON.stringify(person.item)
            let personDiv = document.createElement('div')
            personDiv.innerText = personInfo
            callLogBox.appendChild(personDiv)
          })
          
        }
    }
  })
  let { type, id } = json.data.data.items[0].item;
 
  if (type === "deal") {
    window.open(
      `https://braustinmobilehomes.pipedrive.com/deal/${id}`,
      "_blank"
    );
  } else if (type === "lead") {
    window.open(
      `https://braustinmobilehomes.pipedrive.com/leads/inbox/${id}`,
      "_blank"
    );
    
  } else if (type === 'person'){
     window.open(`https://braustinmobilehomes.pipedrive.com/person/${id}`) 
  }
  else {
    console.log("We couldnt determine the type. Sorry...");
  }
};

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

callApis();

