let socket;
let ready = false;
let lines = "";
let session = "";
let subscription = "";
let events = [];
let goToConnectAuthToken
let portalUserAuthToken



    const setEvents = (event) => {
        events.push(event)
        ready = true
    }
    setEvents()
 
 



  const onMessage = async (event) => {
    const data = JSON.parse(event.data);
    console.log('From onMessage Data',)
    //Waiting for an announce type to avoid duplicate lookup function calls.
    if(data.type === 'announce'){ 
        lookup(data)
    } else {
        
    }
  };

  async function callApis() {
    //The users toekn from to the smaller app
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    goToConnectAuthToken = urlParams.get('gotoconnecttoken')
    portalUserAuthToken = urlParams.get('portalusertoken')
    console.log('Portal User Token', portalUserAuthToken)



    console.log(goToConnectAuthToken, 'Url Params')
      lines = await getLineInfo();
      session = await createSession();
      subscription = await subscribe();
      socket = new WebSocket(session.ws);
      socket.addEventListener("message", onMessage);
      ready = true
  }

  const lookup = async (eventObj) => {
    console.log(portalUserAuthToken)
    const lookupResponse =  await fetch('http://localhost:3001/api/pipedrive', {
      headers: {
        Authorization: `Bearer ${portalUserAuthToken}`,
        "Content-Type": "application/json",
      },
      method: 'POST',
      body: JSON.stringify(eventObj)
    })
    let response = lookupResponse
    const json = await response.json()
    console.log(json)
    let { type, id } = json.data.items[0].item
    if(type === 'deal'){
      window.open(`https://braustinmobilehomes.pipedrive.com/deal/${id}`, '_blank')
    } else if (type === 'lead'){
      window.open(`https://braustinmobilehomes.pipedrive.com/leads/inbox/${id}`, '_blank')
    } else {
      console.log('We couldnt determine the type. Sorry...')
    }
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
    if (!!lines) {
      const firstLine = lines.items[0];
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

callApis()