<script>
  import { onMount } from "svelte";
  import { currentConnection } from "../api/requests.js"
  export let headerMessage = String
  let current = [];

  onMount(async function() {
    const connection = await currentConnection()
    current = connection;
  });
</script>

<style>
  .current-data {
    color: rgb(231, 230, 230);
  }
  .header-container {
    display: flex;
    justify-content: space-around;
    width: 100%;
    background-color: rgb(60, 64, 88);
    border-radius: 10px;
    border: 1px solid rgb(102, 102, 102);
  }
  .header-text {
    color: rgb(231, 230, 230);
    text-align: center;
  }
</style>

<div class="header-container">
  {#each current as connection}
    <p class="current-data">Current SSID: {connection.ssid}</p>
    <p class="current-data">Current BSSID: {connection.bssid}</p>
    <p class="current-data">Current Channel: {connection.channel}</p>
    <p class="current-data">Signal Level: {connection.signal_level}</p>
    <p class="current-data">Security: {connection.security}</p>
  {/each}
</div>

<h2 class="header-text">{headerMessage}</h2>