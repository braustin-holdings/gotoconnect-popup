import OAuth from './util'

let socket;
let ready = false;
let authToken = null;
let lines = "";
let session = "";
let subscription = "";
let events = [];

const oauth = new OAuth({
    clientId: process.env.REACT_APP_GOTO_CONNECT_CLIENT_ID,
  })

export function GoToConnectProvider({children}) {

  const setEvents = (event) => {
    events.push(event)
    ready = true
  }
 
    if(!session){
        callApis();
    } else { 
      return () => socket?.removeEventListener("message", onMessage);
    }



  const onMessage = async (event) => {
    const data = JSON.parse(event.data);

    //Waiting for an announce type to avoid duplicate lookup function calls.
    if(data.type === 'announce'){ 
        lookup(data)
    } else {
        
    }
  };

  async function callApis() {
    //The users toekn from to the smaller app
     oauth.getToken().then(async token => {
      lines = await getLineInfo(token);
      session = await createSession(token);
      subscription = await subscribe(lines, session, token);
      socket = new WebSocket(session.ws);
      socket.addEventListener("message", onMessage);
      ready = true
      authToken = token
      lines = lines
    })
    

  }

  const lookup = async (eventObj) => {
    const lookupResponse =  await API.Pipedrive.searchPipeDriveForUser(eventObj)
    let response = lookupResponse.data

    let { type, id } = response.data.items[0].item
    if(type === 'deal'){
      window.open(`https://braustinmobilehomes.pipedrive.com/deal/${id}`, '_blank')
    } else if (type === 'lead'){
      window.open(`https://braustinmobilehomes.pipedrive.com/leads/inbox/${id}`, '_blank')
    } else {
      console.log('We couldnt determine the type. Sorry...')
    }
  }

  async function getLineInfo(token) {
    const response = await fetch("https://api.jive.com/users/v1/lines", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  }

  async function createSession(token) {
    const response = await fetch("https://realtime.jive.com/v2/session", {
      headers: { Authorization: `Bearer ${token}` },
      method: "POST",
    });
    return response.json();
  }

  async function subscribe(lines, session, token) {
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
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: data,
      });
      return response.json();
    }
  }
}