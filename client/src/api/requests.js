export const netConnect = async (password, ssid) => {
  const fetchMessage = fetch("http://localhost:3000/connect", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-type": "application/json"
    },
    body: JSON.stringify({
      ssid: ssid,
      password: password
    })
  })
    .then(res => res.json())
    .then(resJson => {
      return resJson;
    })
    .catch(error => console.log(error));
  return await fetchMessage;
};


export const closestNetworks = async () => {
    const response = await fetch("http://localhost:3000/networkscanone");
    const json = await response.json();
    return json
    // console.log(json)
};

export const currentConnection = async () => {
  const response = await fetch("http://localhost:3000/currentconnection");
  const json = await response.json();
  return json 
}

